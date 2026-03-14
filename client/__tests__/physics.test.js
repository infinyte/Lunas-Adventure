import Physics from '../scripts/physics';

describe('Physics', () => {
  test('updateEntity applies gravity and movement', () => {
    const physics = new Physics({ gravity: 1, terminalVelocity: 20 });
    const entity = {
      x: 10,
      y: 5,
      velocityX: 2,
      velocityY: 3
    };

    physics.updateEntity(entity, 0.016);

    expect(entity.velocityY).toBe(4);
    expect(entity.x).toBe(12);
    expect(entity.y).toBe(9);
  });

  test('updateEntity caps vertical speed at terminal velocity', () => {
    const physics = new Physics({ gravity: 5, terminalVelocity: 6 });
    const entity = {
      x: 0,
      y: 0,
      velocityX: 0,
      velocityY: 4
    };

    physics.updateEntity(entity, 0.016);

    expect(entity.velocityY).toBe(6);
    expect(entity.y).toBe(6);
  });

  test('checkCollision returns true only when AABBs overlap', () => {
    const physics = new Physics();

    const overlapping = physics.checkCollision(
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10
      },
      {
        x: 5,
        y: 5,
        width: 10,
        height: 10
      }
    );

    const separated = physics.checkCollision(
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10
      },
      {
        x: 20,
        y: 20,
        width: 10,
        height: 10
      }
    );

    expect(overlapping).toBe(true);
    expect(separated).toBe(false);
  });

  test('getCollisionSide returns expected side for horizontal and vertical impacts', () => {
    const physics = new Physics();

    const horizontal = physics.getCollisionSide(
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10
      },
      {
        x: 8,
        y: 0,
        width: 10,
        height: 10
      }
    );

    const vertical = physics.getCollisionSide(
      {
        x: 0,
        y: 0,
        width: 10,
        height: 10
      },
      {
        x: 0,
        y: 8,
        width: 10,
        height: 10
      }
    );

    expect(horizontal).toBe('right');
    expect(vertical).toBe('bottom');
  });
});
