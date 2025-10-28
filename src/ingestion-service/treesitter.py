from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import deque

from tree_sitter import Language, Parser

# import grammars you need here
import tree_sitter_go
import tree_sitter_html
import tree_sitter_json
import tree_sitter_typescript
import tree_sitter_toml
import tree_sitter_yaml

import tree_sitter_dockerfile
import tree_sitter_markdown
import tree_sitter_css


class TreeSitterManager:
    """Manager for tree-sitter languages and parsing.

    Responsibilities:
    - Build a language registry mapping canonical keys to Language objects.
    - Maintain a Parser cache (one Parser per language key).
    - Provide extraction helpers like extract_functions_or_blocks(text, file_path).

    The manager is conservative: for languages that don't have "function" nodes it
    returns an empty list so callers can fall back to file-level chunking.
    """

    def __init__(self):
        # build the language registry (key -> Language)
        self._language_registry: Dict[str, Language] = {
            "go": Language(tree_sitter_go.language()),
            "html": Language(tree_sitter_html.language()),
            "json": Language(tree_sitter_json.language()),
            # "ts": Language(tree_sitter_typescript.language()), # fix no language() in ts library
            # "tsx": Language(tree_sitter_typescript.language()), # fix no language() in ts library
            "toml": Language(tree_sitter_toml.language()),
            "yaml": Language(tree_sitter_yaml.language()),
            "yml": Language(tree_sitter_yaml.language()),
            "dockerfile": Language(tree_sitter_dockerfile.language()),
            "md": Language(tree_sitter_markdown.language()),
            "markdown": Language(tree_sitter_markdown.language()),
            "css": Language(tree_sitter_css.language()),
        }

        # extension -> key mapping
        self._ext_to_key: Dict[str, str] = {
            ".go": "go",
            ".html": "html",
            ".htm": "html",
            ".json": "json",
            ".ts": "ts",
            ".tsx": "tsx",
            ".toml": "toml",
            ".yaml": "yaml",
            ".yml": "yml",
            ".md": "md",
            ".markdown": "markdown",
            ".css": "css",
        }

        # node types to search by language key
        # Extend this dictionary if you want to support more node names
        self._node_selection: Dict[str, Tuple[str, ...]] = {
            "go": ("function_declaration", "method_declaration"),
            "ts": ("function_declaration", "method_definition", "method_signature"),
            "tsx": ("function_declaration", "method_definition", "method_signature"),
            # others intentionally empty -> fallback to chunking
            "html": tuple(),
            "json": tuple(),
            "toml": tuple(),
            "yaml": tuple(),
            "md": tuple(),
            "css": tuple(),
            "dockerfile": tuple(),
        }

        # parser cache
        self._parsers: Dict[str, Parser] = {}

    def _key_for_path(self, path: Path) -> Optional[str]:
        """Return registry key for given path (handles special names like Dockerfile)."""
        # exact name matches
        name = path.name
        if name == "Dockerfile":
            return "dockerfile"
        ext = path.suffix.lower()
        return self._ext_to_key.get(ext)

    def get_parser_for_path(self, path: Path) -> Optional[Parser]:
        key = self._key_for_path(path)
        if not key:
            return None
        lang = self._language_registry.get(key)
        if not lang:
            return None
        parser = self._parsers.get(key)
        if parser is None:
            parser = Parser(lang)
            self._parsers[key] = parser
        return parser

    def extract_functions_or_blocks(self, text: str, path: Path) -> List[Tuple[int, int, Optional[str], str]]:
        """Return list of (start_byte, end_byte, name_or_None, source_text).

        For languages with function-like nodes, returns those nodes. For others returns []
        (caller should fall back to file-level chunking).
        """
        parser = self.get_parser_for_path(path)
        if not parser:
            return []
        try:
            # keep the bytes we pass to parser so byte offsets align
            btext = text.encode("utf8")
            tree = parser.parse(bytes(text, "utf8"))
        except Exception:
            return []
        root = tree.root_node

        key = self._key_for_path(path)
        node_types = self._node_selection.get(key, tuple())
        if not node_types:
            return []

        results: List[Tuple[int, int, Optional[str], str]] = []
        dq = deque([root])
        # common child node types that can hold names in various grammars:
        name_node_types = ("identifier", "name", "property_identifier", "field_identifier", "field_name")

        while dq:
            n = dq.popleft()
            if n.type in node_types:
                start, end = n.start_byte, n.end_byte
                # look for a name-ish child (search deeper if needed)
                name = None

                # first try direct children
                for c in n.children:
                    if c.type in name_node_types:
                        try:
                            # slice from the bytes, then decode to str
                            name = btext[c.start_byte:c.end_byte].decode("utf8", errors="replace")
                        except Exception:
                            name = None
                        break

                # as fallback, search grandchildren (some grammars nest the identifier)
                if name is None:
                    # shallow BFS limited depth 2
                    for c in n.children:
                        for gc in c.children:
                            if gc.type in name_node_types:
                                try:
                                    name = btext[gc.start_byte:gc.end_byte].decode("utf8", errors="replace")
                                except Exception:
                                    name = None
                                break
                        if name:
                            break

                try:
                    src = btext[start:end].decode("utf8", errors="replace")
                except Exception:
                    src = ""
                results.append((start, end, name, src))
            else:
                dq.extend(n.children)
        return results

    # convenience helper for callers that only have extension string
    def extract_by_extension(self, text: str, extension: str) -> List[Tuple[int, int, Optional[str], str]]:
        fake_path = Path(f"/tmp/file{extension}")
        return self.extract_functions_or_blocks(text, fake_path)

