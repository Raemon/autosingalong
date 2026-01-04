import * as THREE from 'three';

export const createDayNightShaderMaterial = (contrast: number, brightness: number, brightnessAdd: number) => {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayTexture: { value: null },
      nightTexture: { value: null },
      luminosityTexture: { value: null },
      sunPosition: { value: new THREE.Vector2() },
      globeRotation: { value: new THREE.Vector2() },
      textureRotation: { value: 0 },
      contrast: { value: contrast },
      brightness: { value: brightness },
      brightnessAdd: { value: brightnessAdd },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      #define PI 3.141592653589793
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D luminosityTexture;
      uniform vec2 sunPosition;
      uniform vec2 globeRotation;
      uniform float textureRotation;
      uniform float contrast;
      uniform float brightness;
      uniform float brightnessAdd;
      varying vec2 vUv;

      void main() {
        vec2 rotatedUv = vUv;
        if (textureRotation != 0.0) {
          rotatedUv.x = mod(vUv.x + textureRotation / (2.0 * PI), 1.0);
        }
        
        // Convert UV to spherical coordinates (lat/lng in radians)
        // In THREE.js UV: y=1 is top (North Pole), y=0 is bottom (South Pole)
        float pointLng = (rotatedUv.x - 0.5) * 2.0 * PI - globeRotation.x * PI / 180.0;
        float pointLat = (rotatedUv.y - 0.5) * PI;
        
        // Sun position in radians (sunPosition.x = lng, sunPosition.y = lat)
        float sunLng = (sunPosition.x + 90.0) * PI / 180.0;
        float sunLat = sunPosition.y * PI / 180.0;
        
        // Convert both to 3D unit vectors
        vec3 pointDir = vec3(
          cos(pointLat) * cos(pointLng),
          sin(pointLat),
          cos(pointLat) * sin(pointLng)
        );
        vec3 sunDir = vec3(
          cos(sunLat) * cos(sunLng),
          sin(sunLat),
          cos(sunLat) * sin(sunLng)
        );
        
        // Dot product gives cosine of angle between surface point and sun direction
        float dotProduct = dot(pointDir, sunDir);
        
        // Smooth transition at terminator
        float blendFactor = smoothstep(-0.1, 0.1, dotProduct);
        
        vec4 dayColor = texture2D(dayTexture, rotatedUv);
        vec4 nightColor = texture2D(nightTexture, rotatedUv);
        
        float nightFactor = 1.0 - blendFactor;
        vec4 luminosityColor = texture2D(luminosityTexture, rotatedUv);
        vec3 luminosityEnhanced = pow(luminosityColor.rgb, vec3(0.9));
        nightColor.rgb += luminosityEnhanced * luminosityColor.a * nightFactor * 1.2;
        
        vec4 blendedColor = mix(nightColor, dayColor, blendFactor);
        vec3 brightened = blendedColor.rgb * brightness + brightnessAdd;
        vec3 contrastAdjusted = (brightened - 0.5) * contrast + 0.5;
        vec3 finalColor = clamp(contrastAdjusted, 0.0, 1.0);
        
        gl_FragColor = vec4(finalColor, blendedColor.a);
      }
    `,
  });
};