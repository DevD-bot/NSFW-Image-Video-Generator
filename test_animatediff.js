const axios = require('axios');
const fs = require('fs');

async function testAnimateDiff() {
    const payload = {
        prompt: "A girl dancing",
        steps: 10,
        width: 512,
        height: 512,
        alwayson_scripts: {
            AnimateDiff: {
                args: [{
                    enable: true,
                    model: "mm_sd_v15_v3.ckpt",
                    video_length: 8,
                    fps: 8,
                    format: ["GIF", "MP4"]
                }]
            }
        }
    };

    console.log("Sending API request to AnimateDiff...");
    try {
        const r = await axios.post('http://127.0.0.1:7860/sdapi/v1/txt2img', payload, {
            timeout: 600000
        });

        console.log(`Received ${r.data.images.length} items back.`);

        fs.writeFileSync('output.json', JSON.stringify({
            imagesCount: r.data.images.length,
            info: r.data.info,
            parameters: r.data.parameters
        }, null, 2));

        // Save the last item to see if it's the video
        if (r.data.images.length > 0) {
            const data = r.data.images[r.data.images.length - 1];
            fs.writeFileSync('test_output.mp4', Buffer.from(data, 'base64'));
            console.log("Saved test_output.mp4");
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

testAnimateDiff();
