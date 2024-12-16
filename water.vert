#version 330 compatibility

// out variables to be interpolated in the rasterizer and sent to each fragment shader:
out vec3 vN;       // normal vector
out vec3 vL;       // vector from point to light
out vec3 vE;       // vector from point to eye
out vec3 vMCposition;

uniform float uA, uB, uC, uD;
uniform float uLightX, uLightY, uLightZ;
vec3 LIGHTPOS = normalize(vec3(uLightX, uLightY, uLightZ));
const float PI = 3.14;

uniform mat4 uModalMatrix;

void main() {
    vMCposition = gl_Vertex.xyz;
    float r = sqrt(pow(vMCposition.x, 2) + pow(vMCposition.y, 2));
    vMCposition.z = uA * cos(2 * PI * uB * r + uC) * exp(-uD * r);

    float drdx = vMCposition.x / r;
    float drdy = vMCposition.y / r;
    float dzdr = uA * (-sin(2. * PI * uB * r + uC) * 2. * PI * uB * exp(-uD * r) + cos(2. * PI * uB * r + uC) * -uD * exp(-uD * r));
    float dzdx = dzdr * drdx;
    float dzdy = dzdr * drdy;

    vec3 Tx = vec3(1., 0., dzdx);
    vec3 Ty = vec3(0., 1., dzdy);
    vN = normalize(cross(Tx, Ty));

    vec3 ECposition = vec3(gl_ModelViewMatrix * vec4(vMCposition, 1.));
    vL = LIGHTPOS - ECposition.xyz;
    vE = vec3(0., 0., 0.) - ECposition.xyz;
    gl_Position = gl_ModelViewProjectionMatrix * vec4(vMCposition, 1.);
}
