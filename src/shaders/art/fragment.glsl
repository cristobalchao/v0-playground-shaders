precision highp float;

varying vec2 vUv;
uniform float iTime;
uniform vec3 iResolution;
uniform float uIterations;
uniform float uAmplitude;
uniform float uFreq;

vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 fragCoord = vec2(vUv.x * iResolution.x, vUv.y * iResolution.y);
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);
    const int MAX_ITERATIONS = 8;
    for (int idx = 0; idx < MAX_ITERATIONS; idx++) {
        float i = float(idx);
        if (i >= uIterations) {
            break;
        }
        uv = fract(uv * uAmplitude) - 0.5;
        float d = length(uv) * exp(-length(uv0));
        vec3 col = palette(length(uv0) + i * 0.4 + iTime * uFreq);
        d = sin(d * 8.0 + iTime) / 8.0;
        d = abs(d);
        d = pow(0.01 / max(d, 1e-4), 1.9);
        finalColor += col * d;
    }
    gl_FragColor = vec4(finalColor, 1.0);
}