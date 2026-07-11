export function applyCombatPolish({ Game, Enemy, PlayerMech }) {
  if (Game.__v4CombatPolishApplied) return;
  Game.__v4CombatPolishApplied = true;

  const originalUpdate = Game.prototype.update;
  Game.prototype.update = function updateWithHitStop(dt) {
    if (this.state === 'combat' && this.hitPause > 0) {
      this.hitPause = Math.max(0, this.hitPause - dt);
      this.updateEffects(dt * .18);
      this.ui.updateHud(this);
      return;
    }
    originalUpdate.call(this, dt);
  };

  const originalEnemyReceiveHit = Enemy.prototype.receiveHit;
  Enemy.prototype.receiveHit = function receiveHitWithFeedback(world, hit) {
    const result = originalEnemyReceiveHit.call(this, world, hit);
    if (!result.applied) return result;

    const melee = hit.type === 'saber';
    const heavy = melee || hit.type === 'missile' || hit.type === 'overdrive';
    const pause = result.killed ? .062 : heavy ? .046 : .026;
    world.hitPause = Math.max(world.hitPause || 0, pause);
    world.renderer.camera.shake = Math.max(
      world.renderer.camera.shake,
      (result.killed ? 8.5 : heavy ? 5.2 : 2.8) * world.renderer.dpr,
    );
    world.spawnVfx({
      type:'impactRing',
      x:this.x,
      y:this.y,
      angle:Math.atan2(this.y-hit.source.y, this.x-hit.source.x),
      color:melee ? '#dffcff' : this.def.color,
      life:result.killed ? .34 : .2,
      scale:this.boss ? 1.6 : this.elite ? 1.22 : .9,
      alpha:result.killed ? .9 : .65,
    });
    return result;
  };

  const originalPlayerTakeDamage = PlayerMech.prototype.takeDamage;
  PlayerMech.prototype.takeDamage = function takeDamageWithFeedback(world, damage, source, type = 'enemy') {
    const applied = originalPlayerTakeDamage.call(this, world, damage, source, type);
    if (applied <= 0) return applied;

    world.hitPause = Math.max(world.hitPause || 0, .052);
    world.renderer.camera.shake = Math.max(world.renderer.camera.shake, 7 * world.renderer.dpr);
    world.spawnVfx({
      type:'impactRing',
      x:this.x,
      y:this.y,
      angle:Math.atan2(this.y-source.y, this.x-source.x),
      color:'#ff8396',
      life:.28,
      scale:1.05,
      alpha:.8,
    });
    return applied;
  };
}
