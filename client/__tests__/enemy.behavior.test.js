import { Enemy } from '../scripts/entities/enemy';

describe('Enemy shooter projectile behavior', () => {
  test('shooter attack returns projectile payload aimed at player', () => {
    const enemy = new Enemy('enemy-shooter', 100, 100, 40, 40, 'shooter');
    const callbackPayloads = [];

    enemy.onProjectileFired = (projectile) => {
      callbackPayloads.push(projectile);
    };

    const projectile = enemy.attack(
      {
        x: 260,
        y: 110,
        width: 40,
        height: 40
      },
      0.016
    );

    expect(projectile).toBeTruthy();
    expect(projectile.enemyId).toBe('enemy-shooter');
    expect(projectile.type).toBe('shooter');
    expect(projectile.damage).toBe(enemy.damage);
    expect(projectile.velocityX).toBeGreaterThan(0);
    expect(projectile.ttl).toBe(3000);
    expect(enemy.attackCooldown).toBe(2);
    expect(enemy.pendingProjectile).toEqual(projectile);
    expect(callbackPayloads).toHaveLength(1);
    expect(callbackPayloads[0]).toEqual(projectile);
  });

  test('shooter cannot fire while attack cooldown is active', () => {
    const enemy = new Enemy('enemy-shooter', 100, 100, 40, 40, 'shooter');

    const firstProjectile = enemy.attack(
      {
        x: 200,
        y: 100,
        width: 40,
        height: 40
      },
      0.016
    );

    const secondAttempt = enemy.attack(
      {
        x: 200,
        y: 100,
        width: 40,
        height: 40
      },
      0.016
    );

    expect(firstProjectile).toBeTruthy();
    expect(secondAttempt).toBe(false);
  });
});
