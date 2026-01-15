# Farmland

[![Go Version](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go)](https://go.dev/)
[![Wails](https://img.shields.io/badge/Wails-v2.11-red?style=flat)](https://wails.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/danielkosgei/farmland/actions/workflows/ci.yml/badge.svg)](https://github.com/danielkosgei/farmland/actions/workflows/ci.yml)
[![Release](https://github.com/danielkosgei/farmland/actions/workflows/release.yml/badge.svg)](https://github.com/danielkosgei/farmland/actions/workflows/release.yml)

A modern, cross-platform desktop application for small-scale farm management. Built with [Wails](https://wails.io/) (Go + React) for a native experience with a beautiful web-based UI.

![Farmland Dashboard](docs/screenshot.png)

## Features

- 🐄 **Livestock Management** - Track animals with lineage (mother/father relationships)
- 🍼 **Milk Production** - Record daily milk yields by animal, track sales and payments
- 👶 **Breeding & Pregnancy** - Record breeding events, track pregnancies, link calves to parents
- 🌾 **Crop Management** - Manage fields, track planting cycles, costs, and yields
- 📦 **Inventory** - Track supplies with low-stock alerts
- 🍽️ **Feed Management** - Log daily feeding and feed grinding operations
- 🏥 **Health & Vet Records** - Treatments, vaccinations, and follow-up reminders
- 💰 **Financial Tracking** - Income/expense tracking with visual summaries
- 🔄 **Auto-Updates** - Built-in update manager with GitHub Releases integration

## Installation

### Download

Download the latest release for your platform from [GitHub Releases](https://github.com/danielkosgei/farmland/releases):

| Platform | Download |
|----------|----------|
| Windows | `farmland-windows-amd64.exe` |
| macOS (Intel) | `farmland-darwin-amd64.zip` |
| macOS (Apple Silicon) | `farmland-darwin-arm64.zip` |
| Linux | `farmland-linux-amd64.tar.gz` |

### Build from Source

#### Prerequisites

- [Go](https://go.dev/dl/) 1.24+
- [Node.js](https://nodejs.org/) 20+
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

#### Linux Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk3-devel
```

#### Build

```bash
# Clone the repository
git clone https://github.com/danielkosgei/farmland.git
cd farmland

# Install frontend dependencies
cd frontend && npm install && cd ..

# Development mode (hot reload)
wails dev

# Production build
wails build -clean
```

The built binary will be in `build/bin/`.

## Development

### Project Structure

```
farmland/
├── app.go              # Application struct and lifecycle
├── main.go             # Entry point with Wails configuration
├── database.go         # SQLite database initialization
├── models.go           # Data structures
├── *_service.go        # Business logic services
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   └── index.css   # Design system
│   └── package.json
├── .github/
│   └── workflows/      # CI/CD pipelines
└── wails.json          # Wails configuration
```

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │Livestock│ │Breeding │ │ Crops   │ ...       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
└───────┼──────────┼──────────┼──────────┼────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Wails Runtime (IPC Bridge)                 │
└───────┬──────────┬──────────┬──────────┬────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (Go)                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────────┐ │
│  │LivestockSvc│ │BreedingSvc│ │  CropsSvc │ │FinancialSvc│ │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────┬──────┘ │
└────────┼─────────────┼─────────────┼──────────────┼─────────┘
         │             │             │              │
         ▼             ▼             ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SQLite Database                          │
│              (~/.farmland/farmland.db)                       │
└─────────────────────────────────────────────────────────────┘
```

### Running Tests

```bash
go test -v ./...
```

### Linting

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run linter
golangci-lint run
```

## Database

Data is stored locally in SQLite at:
- **Windows**: `%USERPROFILE%\.farmland\farmland.db`
- **macOS/Linux**: `~/.farmland/farmland.db`

### Backup

Simply copy the `farmland.db` file to back up all your data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Releasing

Releases are automated via GitHub Actions. To create a new release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow which builds binaries for all platforms and creates a GitHub Release.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Wails](https://wails.io/) - Build desktop apps using Go & Web Technologies
- [React](https://react.dev/) - UI library
- [Lucide](https://lucide.dev/) - Beautiful icons
- [modernc.org/sqlite](https://modernc.org/sqlite) - Pure Go SQLite driver
