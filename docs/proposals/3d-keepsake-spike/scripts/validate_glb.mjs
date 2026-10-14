// CR-0004: validate both shipped assets and the optional-heart export contract.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import validator from 'gltf-validator';

const models = [
  { file: 'jaokob-adult-plush.glb', report: 'glb-validation.json' },
  { file: 'jaokob-childhood-crochet.glb', report: 'childhood-glb-validation.json', childhood: true },
];
for (const model of models) {
  const data = await fs.readFile(new URL(`../model/${model.file}`, import.meta.url));
  const result = await validator.validateBytes(new Uint8Array(data), { uri: model.file, maxIssues: 100 });
  const gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  const primitives = gltf.meshes.flatMap(mesh => mesh.primitives);
  const triangles = gltf.nodes.filter(node => node.mesh !== undefined).reduce((total, node) => total + gltf.meshes[node.mesh].primitives.reduce((sum, primitive) => {
    assert.equal(primitive.mode ?? 4, 4, 'Only triangle primitives are budgeted');
    return sum + gltf.accessors[primitive.indices].count / 3;
  }, 0), 0);
  const externalUris = [...(gltf.buffers ?? []), ...(gltf.images ?? [])].flatMap(item => item.uri ? [item.uri] : []);
  const evidence = { model: model.file, bytes: data.length, byteBudget: 2000000, triangles, triangleBudget: 25000,
    materials: gltf.materials.length, primitives: primitives.length, nodes: gltf.nodes.length,
    nodeNames: gltf.nodes.map(node => node.name), images: gltf.images ?? [],
    extensionsUsed: gltf.extensionsUsed ?? [], externalUris,
    cameras: (gltf.cameras ?? []).length, animations: (gltf.animations ?? []).length, validator: result };
  await fs.writeFile(new URL(`../evidence/${model.report}`, import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ ...evidence, validator: result.issues }, null, 2));
  assert.equal(result.issues.numErrors, 0, `${model.file}: validator errors`);
  assert.equal(result.issues.numWarnings, 0, `${model.file}: validator warnings`);
  assert.ok(data.length <= 2000000 && triangles <= 25000, `${model.file}: export budget`);
  assert.equal(externalUris.length + evidence.cameras + evidence.animations, 0);
  if (model.childhood) {
    assert.deepEqual(evidence.nodeNames.toSorted(), ['Accessory_RedHeart', 'JaoKob_Childhood_Body']);
    const heart = gltf.nodes.find(node => node.name === 'Accessory_RedHeart');
    const body = gltf.nodes.find(node => node.name === 'JaoKob_Childhood_Body');
    assert.notEqual(heart.mesh, body.mesh, 'Heart must be removable without changing body mesh');
    assert.equal(heart.extras.asset_part, 'optional-heart');
    assert.equal(heart.extras.default_visible, true);
    assert.equal(gltf.scenes[gltf.scene].nodes.includes(gltf.nodes.indexOf(heart)), true);
    const crochet = gltf.materials.find(material => material.normalTexture);
    assert.ok(crochet?.pbrMetallicRoughness.baseColorTexture, 'Crochet relief and stitch color are embedded');
    assert.equal(gltf.images.length, 2, 'Two small authored texture tiles, no photos');
    for (const texture of gltf.images) {
      const view = gltf.bufferViews[texture.bufferView];
      const binOffset = 28 + data.readUInt32LE(12);
      const png = data.subarray(binOffset + view.byteOffset, binOffset + view.byteOffset + view.byteLength);
      assert.equal(png.readUInt32BE(16), 128);
      assert.equal(png.readUInt32BE(20), 128);
    }
  }
}
