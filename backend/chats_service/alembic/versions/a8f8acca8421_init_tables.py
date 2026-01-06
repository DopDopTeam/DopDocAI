"""init tables

Revision ID: a8f8acca8421
Revises: 
Create Date: 2026-01-06 12:24:20.330798

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ENUM as PG_ENUM

# revision identifiers, used by Alembic.
revision: str = 'a8f8acca8421'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DB_SCHEMA = "chats"

def upgrade() -> None:
    """Upgrade schema."""
    op.execute(sa.text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))

    # enum message_role (idempotent)
    op.execute(
        sa.text(
            f"""
            DO $$
            BEGIN
                CREATE TYPE "{DB_SCHEMA}".message_role AS ENUM ('user','assistant');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """
        )
    )

    message_role = PG_ENUM(
        "user",
        "assistant",
        name="message_role",
        schema=DB_SCHEMA,
        create_type=False,  # CRITICAL: don't auto-create during create_table
    )

    op.create_table('chats',
    sa.Column('id', PG_UUID(as_uuid=True), nullable=False),
    sa.Column('repo_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    schema=DB_SCHEMA
    )

    op.create_table('messages',
    sa.Column('id', PG_UUID(as_uuid=True), nullable=False),
    sa.Column('chat_id', PG_UUID(as_uuid=True), nullable=False),
    sa.Column('role', message_role, nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['chat_id'], ['chats.chats.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema=DB_SCHEMA
    )

    # indexes (practical)
    op.create_index("ix_chats_user_id", "chats", ["user_id"], schema=DB_SCHEMA)
    op.create_index("ix_chats_repo_id", "chats", ["repo_id"], schema=DB_SCHEMA)
    op.create_index("ix_messages_chat_id_created_at", "messages", ["chat_id", "created_at"], schema=DB_SCHEMA)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_messages_chat_id_created_at", table_name="messages", schema=DB_SCHEMA)
    op.drop_table('messages', schema=DB_SCHEMA)

    op.drop_index("ix_chats_repo_id", table_name="chats", schema=DB_SCHEMA)
    op.drop_index("ix_chats_user_id", table_name="chats", schema=DB_SCHEMA)
    op.drop_table('chats', schema=DB_SCHEMA)

    op.execute(sa.text(f'DROP TYPE IF EXISTS "{DB_SCHEMA}".message_role'))
