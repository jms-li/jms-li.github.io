let app = document.getElementById("app");
app.width = window.innerWidth;
app.height = window.innerHeight;
let ctx = app.getContext("2d");
let w = null;
let scene = null;
const centerX = Math.floor((window.innerWidth-800)/2);
const centerY = Math.floor((window.innerHeight-600)/2);


function make_environment(...envs) {
    return new Proxy(envs, {
        get(target, prop, receiver) {
            for (let env of envs) {
                if (env.hasOwnProperty(prop)) {
                    return env[prop];
                }
            }
            return (...args) => {
                throw new Error(`NOT IMPLEMENTED: ${prop} ${args}`)
            }
        }
    });
}

function keyToScancode(code) {
    const map = {
        'ArrowUp': 0x48,
        'ArrowDown': 0x50,
        'ArrowLeft': 0x4B,
        'ArrowRight': 0x4D
    };
    return map[code];
}

async function instantiateWasmScene() {
    const wasmTrinket = await WebAssembly.instantiateStreaming(fetch('./scene.wasm'), {
        "env": make_environment({
            "atan2f": Math.atan2,
            "cosf": Math.cos,
            "sinf": Math.sin,
            "sqrtf": Math.sqrt,
            "abs": Math.abs,
        })
    });
    const buffer = wasmTrinket.instance.exports.memory.buffer;
    const keyStateAddr = wasmTrinket.instance.exports.key_states.value;
    wasmTrinket.instance.exports.main();
    const pixels = wasmTrinket.instance.exports.dst;
    const torus_pixels = wasmTrinket.instance.exports.torus_image_data;
    const scene = { wasmTrinket, buffer, keyStateAddr, pixels, torus_pixels };
    return scene;
}

(async () => {
    scene = await instantiateWasmScene();
    window.addEventListener('keydown', e => {
        const scancode = keyToScancode(e.code);
        if(scancode) {
            scene.wasmTrinket.instance.exports.handle_key(scancode, 1);
        }
    });
    window.addEventListener('keyup', e => {
        const scancode = keyToScancode(e.code);
        if(scancode) {
            scene.wasmTrinket.instance.exports.handle_key(scancode, 0);
        }
    });
    
    function step(timestamp) {
        scene.wasmTrinket.instance.exports.implement_input();
        scene.wasmTrinket.instance.exports.updatedef();
        const image = new ImageData(new Uint8ClampedArray(scene.buffer, scene.pixels, 800*600*4), 800);
        const torus_image = new ImageData(new Uint8ClampedArray(scene.buffer, scene.torus_pixels, 200*100*4), 200);
        ctx.putImageData(image, centerX, centerY);
        ctx.putImageData(torus_image, 0, 0);
        // testing images, will probably change how this is done later
        //const testimage = new Image();
        //testimage.src = 'torus0.png';
        //testimage.onload = function() {
           // ctx.drawImage(testimage, 100, 300);
       // };
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);

})();

//WebAssembly.instantiateStreaming(fetch('./trinket.wasm'), {
//    "env": make_environment({
//        "atan2f": Math.atan2,
//        "cosf": Math.cos,
//        "sinf": Math.sin,
//        "sqrtf": Math.sqrt,
//        "abs": Math.abs,
//    })
//}).then(w0 => {
//    w = w0;
//    const buffer = w.instance.exports.memory.buffer;
//    w.instance.exports.scene.len = 0;
//    w.instance.exports.set3d(&scene.position, 0, 0, 0);
//    w.instance.exports.set3d(&scene.scale, 1, 1, 1);
//    w.instance.exports.set3d(&scene.rotation, 0, 0, 0);
//    w.instance.exports.cam.range = 50;
//    w.instance.exports.set3d(&cam.rotation, 180, 0, 0);
//    w.instance.exports.set3d(&cam.trotation, 180, 0, 0);
   
//    w.instance.exports.rotate(createbox(&scene, 20, 20, 20, 0xff00ff00), 120, 45, 0);
//    w.instance.draw(dst);
//    w.instance.exports.main();
//    const pixels = w.instance.exports.dst;
//    const image = new ImageData(new Uint8ClampedArray(buffer, pixels, app.width*app.height*4), app.width);
//    ctx.putImageData(image, 0, 0);
//})
