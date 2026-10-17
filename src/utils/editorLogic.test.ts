import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultDocument,
  createTextLayer,
  createShapeLayer,
  reorderLayers,
  duplicateLayer,
  deleteLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  applyMove,
  clamp,
  scaleLayer,
  isPointInLayer,
} from './editorLogic.ts';

test('createDefaultDocument initializes document with given dimensions', () => {
  const doc = createDefaultDocument('Test Doc', 1080, 1920, '#000000');
  assert.equal(doc.name, 'Test Doc');
  assert.equal(doc.width, 1080);
  assert.equal(doc.height, 1920);
  assert.equal(doc.backgroundColor, '#000000');
  assert.equal(doc.layers.length, 0);
  assert.ok(doc.id.startsWith('doc_'));
});

test('createTextLayer creates independent editable text object with effects', () => {
  const textLayer = createTextLayer('Hello World', 50, 60);
  assert.equal(textLayer.type, 'text');
  assert.equal(textLayer.textData?.text, 'Hello World');
  assert.equal(textLayer.x, 50);
  assert.equal(textLayer.y, 60);
  assert.equal(textLayer.isVisible, true);
  assert.equal(textLayer.isLocked, false);
  assert.ok(textLayer.effects.stroke !== undefined);
  assert.ok(textLayer.effects.outerGlow !== undefined);
});

test('layer operations: visibility, lock, reorder, duplicate and delete', () => {
  const l1 = createTextLayer('Layer 1', 0, 0);
  const l2 = createShapeLayer('rectangle', 10, 10);
  const l3 = createTextLayer('Layer 3', 20, 20);
  const layers = [l1, l2, l3];

  // Visibility toggle
  const hidden = toggleLayerVisibility(layers, l1.id);
  assert.equal(hidden[0].isVisible, false);
  assert.equal(hidden[1].isVisible, true);

  // Lock toggle
  const locked = toggleLayerLock(layers, l2.id);
  assert.equal(locked[1].isLocked, true);

  // Move locked vs unlocked
  const movedUnlocked = applyMove(l1, 15, -10);
  assert.equal(movedUnlocked.x, 15);
  assert.equal(movedUnlocked.y, -10);

  const movedLocked = applyMove({ ...l2, isLocked: true }, 15, -10);
  assert.equal(movedLocked.x, l2.x); // Should not move if locked

  // Reorder
  const movedUp = reorderLayers(layers, l1.id, 'up');
  assert.equal(movedUp[0].id, l2.id);
  assert.equal(movedUp[1].id, l1.id);

  // Duplicate
  const { layers: duplicated, newLayer } = duplicateLayer(layers, l2.id);
  assert.equal(duplicated.length, 4);
  assert.ok(newLayer);
  assert.equal(newLayer?.x, l2.x + 30);

  // Delete
  const deleted = deleteLayer(layers, l2.id);
  assert.equal(deleted.length, 2);
  assert.equal(deleted.find((l) => l.id === l2.id), undefined);
});

test('clamp utility constrains numbers properly', () => {
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(7, 0, 10), 7);
});

test('scaleLayer multiplies px measurements and leaves the original untouched', () => {
  const layer = createTextLayer('Scale me', 10, 20);
  layer.effects.dropShadow.distance = 12;
  assert.equal(scaleLayer(layer, 1), layer); // identity at 1x

  const scaled = scaleLayer(layer, 2);
  assert.equal(scaled.x, 20);
  assert.equal(scaled.width, 800);
  assert.equal(scaled.textData?.fontSize, 96);
  assert.equal(scaled.effects.dropShadow.distance, 24);
  assert.equal(layer.width, 400);
  assert.equal(layer.textData?.fontSize, 48);

  const shape = scaleLayer(createShapeLayer('rounded-rect'), 0.5);
  assert.equal(shape.shapeData?.cornerRadius, 12);
});

test('isPointInLayer respects rotation', () => {
  const layer = createShapeLayer('rectangle', 0, 0, 200, 20);
  assert.equal(isPointInLayer(layer, 100, 10), true);
  assert.equal(isPointInLayer(layer, 100, 60), false);

  layer.rotation = 90; // wide bar becomes a tall bar around the same centre
  assert.equal(isPointInLayer(layer, 100, 90), true);
  assert.equal(isPointInLayer(layer, 190, 10), false);
});
