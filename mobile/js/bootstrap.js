import * as THREE from "three";

window.THREE = THREE;

const scripts = ["js/renderer3d.js?v=2", "js/game.js?v=10"];

for (const src of scripts) {
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}
