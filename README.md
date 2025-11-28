# ZenTab - Liquid Glass New Tab

<div align="center">

![Version](https://img.shields.io/badge/version-0.8.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Firefox-orange.svg)

A minimal, highly customizable New Tab page with a premium **Liquid Glass** aesthetic.  
Beautiful, functional, and privacy-focused.

[![Firefox Add-on](https://img.shields.io/badge/Firefox-Download-FF7139?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/it/firefox/addon/zentab/)

[Features](#features) • [Setup](#setup) • [Customization](#customization) • [Development](#development)

</div>

---

## ✨ Features

### Core Widgets

| Widget | Description |
|--------|-------------|
| **⏰ Clock** | Precision digital clock with 5 distinct styles: Default, Minimal, Bold, Liquid, Neon |
| **📖 Literature Clock** | Displays iconic F1 driver quotes synchronized with current time |
| **🌤️ Weather** | Real-time weather data including temperature, wind speed, and humidity (no API key required) |
| **📝 Notes** | Auto-saving notepad with copy and clear functionality |
| **✅ ToDo List** | Task management system for daily goal tracking |
| **🏎️ Racing Calendar** | Complete F1 schedule with practice sessions, qualifying, and race countdowns |
| **🌐 IP Information** | Network details including public IP address, geolocation, and ISP provider |
| **🍅 Pomodoro Timer** | Customizable focus timer with work/break intervals for enhanced productivity |
| **🔗 Quick Links** | User-defined shortcuts for frequently accessed websites and services |

### 🎨 Customization Options

- **Theme System**: Light, Dark, and AMOLED (pure black) display modes
- **Dynamic Layout**: Fully draggable and resizable widgets via Edit Mode
- **Background Control**: Custom image upload or external URL integration
- **Glassmorphism Effects**: Adjustable blur intensity from 0 to 50 pixels
- **Custom CSS Injection**: Advanced styling capabilities for power users
- **Multilingual Support**: Available in English 🇬🇧 and Italian 🇮🇹

### 🔒 Privacy & Performance

- **Zero Tracking** - No analytics, telemetry, or data collection
- **Local Storage** - All preferences and data stored exclusively in browser
- **Optimized Performance** - Built with Vanilla JavaScript for minimal overhead
- **Open Source** - Fully transparent codebase available for audit and modification

---

## 🚀 Setup

### Installation

1. Install the extension from your browser's extension store (Chrome Web Store, Edge Add-ons, or Firefox Add-ons)
2. Open a new tab to activate ZenTab automatically
3. Access Settings via the gear icon (bottom right) to configure widgets and preferences

### Quick Start

- Toggle widgets on/off from the Settings panel
- Enable Edit Mode to reposition and resize widgets
- Add Quick Links for instant access to your most-used websites
- Customize appearance through theme selection and blur effects

---

## 🛠️ Development

### Project Structure
```
ZenTab/
├── index.html          # Application entry point
├── css/
│   └── styles.css      # Styling and CSS variables
├── js/
│   ├── app.js          # Core logic and state management
│   └── icons.js        # SVG icon registry
├── assets/             # Static resources (icons, images)
└── manifest.json       # Browser extension configuration
```

### Technology Stack

- **HTML5** - Semantic markup structure
- **CSS3** - Advanced glassmorphism effects and animations
- **Vanilla JavaScript** - Framework-free implementation for optimal performance
- **ES6 Modules** - Modern, maintainable architecture

### Building from Source

1. Clone the repository
2. Load as unpacked extension in your browser's developer mode
3. Modify source files as needed
4. Reload extension to apply changes

---

## 🎯 Credits

### External Services

- **Typography**: [Inter](https://fonts.google.com/specimen/Inter) typeface by Google Fonts
- **Weather Data**: [Open-Meteo](https://open-meteo.com/) - Free meteorological API
- **IP Geolocation**: [ipapi](https://ipapi.co/) - Network information service
- **Racing Calendar**: [Jolpica F1](https://jolpi.ca/) - Formula 1 schedule and results

---

## 📄 License

Released under the MIT License.  
See LICENSE file for full terms and conditions.

---

<div align="center">

**Developed by Robert Ciobanu** 🚀

⭐ Star this project on GitHub if you find it useful

</div>
