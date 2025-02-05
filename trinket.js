let app = document.getElementById("app");
app.width = 800;
app.height = 600;
let ctx = app.getContext("2d");
let w = null;

function make_environment(...envs) {
    return new Proxy(envs, {
        get(target, prop, receiver) {
            for (let env of envs) {
                if (env.hasOwnProperty(prop)) {
                    return env[prop];
                }
            }
            return (...args) => {console.error("NOT IMPLEMENTED: "+prop, args)}
        }
    });
}

WebAssembly.instantiateStreaming(fetch('./trinket.wasm'), {
    "env": make_environment({
        "atan2f": Math.atan2,
        "cosf": Math.cos,
        "sinf": Math.sin,
        "sqrtf": Math.sqrt,
        "abs": Math.abs,
    })
}).then(w0 => {
    w = w0;
    const buffer = w.instance.exports.memory.buffer;

    w.instance.exports.main();
    const pixels = w.instance.exports.dst;
    const image = new ImageData(new Uint8ClampedArray(buffer, pixels, app.width*app.height*4), app.width);
    ctx.putImageData(image, 0, 0);
})
