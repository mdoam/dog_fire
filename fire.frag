#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float uKa; // coefficients of each type of lighting -- make sum to 1.0
uniform float iTime;
uniform sampler2D TexUnitA;
uniform float uBlend;
uniform bool uGreen, uBlue;

#define timeScale 			iTime * 1.0
#define fireMovement 		vec2(-0.01, -0.5)

// in variables from the vertex shader and interpolated in the rasterizer:
in vec3 vMCposition;

vec2 hash( vec2 p ) {
	p = vec2( dot(p,vec2(127.1,311.7)),
			  dot(p,vec2(269.5,183.3)) );

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
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

void main() {
    vec2 uvT = (vMCposition.xy * vec2(1.0, 0.5)) + timeScale * fireMovement;
    float n1 = pow(fbm(8.0 * uvT), 1.0);

    float gradient = pow(1.0 - vMCposition.y, 2.0) * 5.;
    float finalNoise = n1 * gradient;
    vec3 color = finalNoise * vec3(2.*n1, 2.*n1*n1*n1, n1*n1*n1*n1);
    if (uBlue) { 
        color = color.zyx;
    }
    if (uGreen) {
        color = 0.85*color.yxz;
    }

    vec3 ambient = uKa * color.rgb;
    vec3 colorA = texture(TexUnitA,0.5+0.5*vMCposition.xy).rgb;
    vec3 mixedColor = mix(ambient, colorA, uBlend);
    gl_FragColor = vec4(mixedColor, 1.);
}
