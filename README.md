# NSFW-Image-Video-Generator (SilkDream Studio)

> **Private. Unlimited. Unrestricted.**
> A premium local NSFW AI image & video generation platform powered by Stable Diffusion, AnimateDiff, and Node.js.

---

## ⚡ Local Machine Installation & Usage

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DevD-bot/NSFW-Image-Video-Generator.git
   cd NSFW-Image-Video-Generator
   ```

2. **Install Node dependencies:**
   Double-click `install.bat` (or run `npm install`).

3. **Start the AI Backend:**
   Ensure you have Automatic1111 WebUI installed. You **must** launch it with the `--api` flag.
   *(See the Automatic1111 setup section below for optimized 8GB VRAM settings).*

4. **Launch the Studio:**
   Double-click `start.bat`. Your browser will automatically open to `http://localhost:3000`.

---

## 🎮 Recommended Hardware

| Component | Yours | Status |
|-----------|-------|--------|
| GPU | RTX 3060 Ti 8GB | ✅ Supported |
| RAM | 16GB+ | ✅ Required |
| Storage | 200GB+ SSD | ✅ Required |
| CUDA | 11.8 / 12.1 | ✅ Required |

---

## 📦 Recommended Models

### 🖼️ Image Checkpoints
Download from [Civitai.com](https://civitai.com) → place in `stable-diffusion-webui/models/Stable-diffusion/`

| Model | Best For | VRAM | Download |
|-------|---------|------|----------|
| **Juggernaut XL v9** | Photorealistic women, best skin | ~7GB | Civitai |
| **epiCRealism v5** | Fast, natural skin tones | ~4.5GB | Civitai |
| **CyberRealistic v4** | Real lighting, faces | ~4.5GB | Civitai |
| **RealDream 12** | NSFW trained, detailed | ~4.5GB | Civitai |
| **Pony Diffusion V6 XL** | Semi-real / stylized NSFW | ~7GB | Civitai |

### 🎬 Video / Animation Models
Place in `stable-diffusion-webui/extensions/sd-webui-animatediff/model/`

| Model | Use Case | VRAM | Download |
|-------|----------|------|----------|
| **AnimateDiff v3 (mm_sd_v15_v3)** | Animate SD1.5 checkpoints | ~7GB | HuggingFace |
| **AnimateDiff SDXL (mm_sdxl_v10)** | Animate SDXL checkpoints | ~8GB | HuggingFace |
| **Stable Video Diffusion (SVD)** | Image-to-video, smooth motion | ~8GB | HuggingFace |
| **Hotshot-XL** | Fast SDXL animation | ~7GB | HuggingFace |

### 🧩 LoRAs (Quality Boosters)
Place in `stable-diffusion-webui/models/Lora/`

| LoRA | Effect | Weight |
|------|--------|--------|
| **DetailTweaker XL** | Skin pores, fine texture | 0.6–0.8 |
| **Skin & Realism XL** | Hyperrealistic skin tones | 0.4–0.6 |
| **Lighting Master** | Studio/natural lighting | 0.5 |
| **Anatomy Fix XL** | Fix body distortions | 0.3–0.5 |
| **ADetailer Face** | Perfect facial details | auto |

### 🔧 Required A1111 Extensions
| Extension | Purpose | Install via |
|-----------|---------|-------------|
| **ADetailer** | Auto face/body fix | A1111 Extension tab |
| **AnimateDiff** | Video generation | A1111 Extension tab |
| **ControlNet** | Pose/motion control | A1111 Extension tab |
| **Ultimate SD Upscale** | 4K upscaling | A1111 Extension tab |
| **Tiled Diffusion** | Large resolution | A1111 Extension tab |

---

## ⚙️ Automatic1111 Setup for RTX 3060 Ti

### `webui-user.bat` settings:
```bat
set COMMANDLINE_ARGS=--xformers --medvram --opt-split-attention --api --listen
```

### Launch flags explained:
- `--xformers` → Memory-efficient attention (big speedup)
- `--medvram` → Optimized for 8GB VRAM
- `--opt-split-attention` → More VRAM optimization
- `--api` → **Required** for SilkDream to connect
- `--listen` → Allows local network access

---

## 🎬 Video Generation Strategy

### Short Clips (2–4 seconds)
- Uses AnimateDiff directly
- 16–24 frames at 512x768 or 768x512
- Best motion quality on 8GB VRAM

### Long Videos (30 sec – 5 min+)
- SilkDream generates multiple short clips automatically
- Each clip uses temporal consistency (same seed + prompt)
- Clips are auto-stitched into a single MP4 using FFmpeg
- No VRAM limitation — only time limitation

---

## 🌸 Recommended Prompts for Realistic Results

### Positive Prompt Template:
```
(photorealistic:1.3), RAW photo, 8k uhd, DSLR quality, 
sharp focus, professional lighting, perfect skin texture, 
detailed pores, beautiful [age] year old woman, 
[hair description], [eye color] eyes, [scene description],
masterpiece, best quality
```

### Negative Prompt (always use):
```
cartoon, anime, illustration, 3d render, painting, drawing,
bad anatomy, deformed, ugly, blurry, watermark, text, logo,
worst quality, low quality, bad hands, extra fingers,
mutated, disfigured, monochrome
```

---

## 📁 Output Structure

```
SilkDream/
└── outputs/
    ├── images/     ← Generated images (PNG)
    ├── videos/     ← Final videos (MP4)
    └── clips/      ← Temp clips for stitching
```

---

## 🚀 SilkDream Features

- ✅ **Text-to-Image** with full parameter control
- ✅ **Short Video** via AnimateDiff
- ✅ **Long Video** via automatic clip stitching
- ✅ **Gallery** — browse all past generations
- ✅ **Model Switcher** — change checkpoint from UI
- ✅ **Prompt Templates** — save and reuse prompts
- ✅ **One-click export** — download images/videos

---

*SilkDream runs 100% locally. No data leaves your machine.*
