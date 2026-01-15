package main

// Version is set at build time via ldflags
// Build with: go build -ldflags "-X main.Version=v1.0.0"
var Version = "dev"

// GetVersion returns the current application version
func GetVersion() string {
	return Version
}
