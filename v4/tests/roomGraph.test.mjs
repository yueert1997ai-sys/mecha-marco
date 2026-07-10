import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomGraph, describeRoomChoice } from '../src/run/roomGraph.js';

for (const seed of [1,2,3,42,20260711]) {
  test(`room graph is valid for seed ${seed}`, () => {
    const graph = generateRoomGraph(seed, 10);
    assert.equal(graph.nodes.length, 10);
    assert.equal(graph.nodes.at(-1).choices[0].boss, true);
    graph.nodes.forEach((node, depth) => {
      assert.equal(node.depth, depth);
      assert.ok(node.choices.length >= 1 && node.choices.length <= 2);
      const ids = new Set(node.choices.map((choice) => choice.id));
      assert.equal(ids.size, node.choices.length);
      for (const choice of node.choices) {
        const desc = describeRoomChoice(choice);
        assert.ok(desc.name.length > 0);
        if (choice.type === 'combat') assert.ok(choice.template);
      }
      if (node.choices.length === 2 && node.choices.every((c) => c.type === 'combat')) {
        assert.notEqual(node.choices[0].reward, node.choices[1].reward);
        assert.notEqual(node.choices[0].template, node.choices[1].template);
      }
    });
  });
}
