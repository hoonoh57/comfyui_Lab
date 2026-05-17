# ComfyUI Media Generation Lab

RTX 4070 8GB VRAM optimized media generation app with ComfyUI backend.

## Quick Start
1. Run `server_launcher.bat` to start ComfyUI
2. Open `index.html` in browser
3. Click Connect - auto-detects running server

## Requirements
- Windows 10/11, NVIDIA RTX 4070 8GB, 32GB RAM
- ComfyUI at `E:\ComfyUI_New`
- Custom nodes: `ComfyUI_IPAdapter_plus`, `comfyui_controlnet_aux`

## Features
- Dynamic workflow builder (IPAdapter + ControlNet + DWPose)
- Genre presets, quick profiles (Quality/Balanced/Speed)
- Persistent preset saving (localStorage + JSON export)
- Auto model detection from server
- VRAM-safe: nodes added only when needed
