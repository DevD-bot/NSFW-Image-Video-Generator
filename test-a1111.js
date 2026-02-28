const axios = require('axios');

async function test() {
    try {
        const payload = {
            prompt: "girl dancing",
            negative_prompt: "",
            steps: 20,
            cfg_scale: 7,
            width: 512,
            height: 768,
            sampler_name: 'Euler a',
            seed: -1,
            alwayson_scripts: {
                AnimateDiff: {
                    args: [{
                        enable: true,
                        model: "mm_sd_v15_v3.ckpt",
                        format: ['MP4', 'GIF'],
                        video_length: 8,
                        fps: 8,
                        loop_number: 0,
                        closed_loop: 'R+P',
                        batch_size: 1,
                        stride: 1,
                        overlap: -1
                    }]
                }
            }
        };
        console.log("Sending request to A1111...");
        const r = await axios.post('http://127.0.0.1:7860/sdapi/v1/txt2img', payload, { timeout: 600000 });
        console.log("Success! Images returned:", r.data.images ? r.data.images.length : 0);
    } catch (err) {
        console.error("Error from A1111:", err.response ? err.response.data : err.message);
    }
}

test();
