package models

import "time"

type BuildInfo struct {
	Version   string
	Commit    string
	BuildTime string
}

type JWT struct {
	AccessTTL  time.Duration
	RefreshTTL time.Duration
	Secret     []byte
	Pepper     []byte
}

type Cookie struct {
	Domain string
	Secure bool
}
