import fs from 'node:fs/promises';
import validator from 'gltf-validator';

const file = new URL('../model/jaokob-adult-plush.glb', import.meta.url);
const data = await fs.readFile(file);
const result = await validator.validateBytes(new Uint8Array(data), { uri: 'jaokob-adult-plush.glb', maxIssues: 100 });
const jsonLength = data.readUInt32LE(12);
const gltf = JSON.parse(data.subarray(20, 20 + jsonLength).toString());
const primitives = gltf.meshes.flatMap(mesh => mesh.primitives);
const triangles = primitives.reduce((sum, primitive) => sum + gltf.accessors[primitive.indices].count / 3, 0);
const externalUris = [...(gltf.buffers ?? []), ...(gltf.images ?? [])].flatMap(item => item.uri ? [item.uri] : []);
const evidence = { bytes: data.length, byteBudget: 2000000, triangles, materials: gltf.materials.length,
  primitives: primitives.length, nodes: gltf.nodes.length, extensionsUsed: gltf.extensionsUsed ?? [],
  externalUris, cameras: (gltf.cameras ?? []).length, animations: (gltf.animations ?? []).length,
  validator: result };
await fs.writeFile(new URL('../evidence/glb-validation.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ ...evidence, validator: result.issues }, null, 2));
if (result.issues.numErrors || data.length > 2000000 || externalUris.length || evidence.cameras || evidence.animations) process.exitCode = 1;
