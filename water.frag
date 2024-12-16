#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform float uKa, uKd, uKs; // coefficients of each type of lighting -- make sum to 1.0
uniform float uShininess;    // specular exponent
uniform float uBlend;
uniform vec4 uColor, uSpecularColor;

// square-equation uniform variables -- these should be set every time Display( ) is called:
uniform float uNoiseAmp, uNoiseFreq, uDistortionS;
uniform sampler2D Noise2;
uniform sampler3D Noise3;
uniform sampler2D TexUnitA;

// in variables from the vertex shader and interpolated in the rasterizer:
in vec3 vN;          // normal vector
in vec3 vL;          // vector from point to light
in vec3 vE;          // vector from point to eye
in vec3 vMCposition;

vec3 RotateNormal(float angx, float angy, vec3 n) {
    float cx = cos(angx);
    float sx = sin(angx);
    float cy = cos(angy);
    float sy = sin(angy);

    // rotate about x:
    float yp = n.y * cx - n.z * sx; // y'
    n.z = n.y * sx + n.z * cx;      // z'
    n.y = yp;

    // rotate about y:
    float xp = n.x * cy + n.z * sy; // x'
    n.z = -n.x * sy + n.z * cy;     // z'
    n.x = xp;

    return normalize(n);
}

void main() {
    // remap distortion with strengh from 0 -> 1
    vec4 d = texture(Noise3, vMCposition) * uDistortionS;
    
    // gradiant mask to control how large the fire is
    float grad = mix(2.0, 0.0, vMCposition.y +  1.3);
    vec4 d1 = d * 0.2;
    vec4 d2 = (d * 2.0 - 1.) * 0.2;
    
    vec4 nvx = texture(Noise3, vMCposition + d.rgb);
    nvx = smoothstep(0.3, 0.7, nvx);
    float angx = nvx.r + nvx.g + nvx.b + nvx.a - 2.; // -1. to +1.
    angx *= uNoiseAmp;

    vec4 nvy = texture(Noise3, vMCposition + d.rgb);
    
    nvy = mix(vec4(1,1,0,1), vec4(1,0,0,1), nvy);
    nvy = smoothstep(0.3, 0.7, nvy);
    float angy = nvy.r + nvy.g + nvy.b + nvy.a - 2.; // -1. to +1.
    angy *= uNoiseAmp;

    vec3 n = RotateNormal(angx, angy, vN);
    n += grad;

    vec3 Normal = normalize(gl_NormalMatrix * n);
    vec3 Light = normalize(vL);
    vec3 Eye = normalize(vE);

    // here is the per-fragment lighting:
    vec3 ambient = uKa * uColor.rgb;

    float dd = 0.; // only do diffuse if the light can see the point
    float ss = 0.;

    if (dot(Normal, Light) > 0.) { // only do specular if the light can see the point
        dd = dot(Normal, Light);
        vec3 ref = normalize(reflect(-Light, Normal));
        ss = pow(max(dot(Eye, ref), 0.), uShininess);
    }
    vec3 diffuse = uKd * dd * uColor.rgb;
    vec3 specular = uKs * ss * uSpecularColor.rgb;

    vec3 colorA = texture(TexUnitA,0.5+0.5*vMCposition.xy).rgb;
    vec3 mixedColor = mix(ambient + diffuse + specular, colorA, uBlend);
    gl_FragColor = vec4(mixedColor, 1.);
}
