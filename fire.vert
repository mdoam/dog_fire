#version 330 compatibility

// out variables to be sent to each fragment shader:
out vec3 vMCposition;

uniform float iTime;

#define iResolution         vec2(1600., 1200.)
#define timeScale 			iTime * 1.0
#define distortionMovement	vec2(-0.01, -0.3)
#define normalStrength		40.0
#define distortionStrength	0.1

/** NOISE **/
vec2 hash(vec2 position) {
    position = vec2(dot(position, vec2(127.1, 311.7)),
                    dot(position, vec2(269.5, 183.3)));

    return -1.0 + 2.0 * fract(sin(position) * 43758.5453123);
}

float noise(vec2 position) {
    const float constant1 = (sqrt(3) - 1) / 2;
    const float constant2 = (3 - sqrt(3)) / 6;

    vec2 gridPoint = floor(position + (position.x + position.y) * constant1);
    
    vec2 offset1 = position - gridPoint + (gridPoint.x + gridPoint.y) * constant2;
    vec2 stepDirection = step(offset1.yx, offset1.xy);    
    vec2 offset2 = offset1 - stepDirection + constant2;
    vec2 offset3 = offset1 - 1.0 + 2.0 * constant2;

    vec3 weights = max(0.5 - vec3(dot(offset1, offset1), dot(offset2, offset2), dot(offset3, offset3)), 0.0);

    vec3 gradient = weights * weights * weights * weights * vec3(dot(offset1, hash(gridPoint + 0.0)), dot(offset2, hash(gridPoint + stepDirection)), dot(offset3, hash(gridPoint + 1.0)));

    return dot(gradient, vec3(70.0));
}


float fbm(vec2 position) {
    float total = 0.0;
    mat2 transformation = mat2(1.6, 1.2, -1.2, 1.6);
    total += 0.5000 * noise(position); position = transformation * position;
    total += 0.2500 * noise(position); position = transformation * position;
    total += 0.1250 * noise(position); position = transformation * position;
    total += 0.0625 * noise(position); position = transformation * position;
    total = 0.5 + 0.5 * total;
    return total;
}

/** DISTORTION **/
vec3 bumpMap(vec2 uv) { 
    vec2 s = 1. / iResolution.xy;
    float p =  fbm(uv);
    float h1 = fbm(uv + s * vec2(1., 0));
    float v1 = fbm(uv + s * vec2(0, 1.));
       
   	vec2 xy = (p - vec2(h1, v1)) * normalStrength;
    return vec3(xy + .5, 1.);
}

void main() {
    vMCposition = gl_Vertex.xyz;
    
    vec3 normal = bumpMap(vMCposition.xy * vec2(1.0, 0.3) + distortionMovement * timeScale);
    vec2 displacement = clamp((normal.xy - .5) * distortionStrength, -1., 1.);
    vMCposition.xy += displacement;

    gl_Position = gl_ModelViewProjectionMatrix * vec4(vMCposition, 1.);
}
