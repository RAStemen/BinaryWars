using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using BinaryWars.Actors;
using BinaryWars.Behaviors;

namespace BinaryWars
{
    public class BulletBehavior : BWBehavior
    {
        public BulletBehavior(Bullet bullet, float basePriority)
            : base(basePriority)
        {
            Bullet = bullet;
            Angle = bullet.Angle;
        }

        public Bullet Bullet { get; private set; }

        public override void Action()
        {
            Vector2 nextPosition = Bullet.Position;

            nextPosition.X = (float)(nextPosition.X - Math.Cos(Angle) * Priority * Bullet.Speed);
            nextPosition.Y = (float)(nextPosition.Y - Math.Sin(Angle) * Priority * Bullet.Speed);

            Bullet.Position = nextPosition;
        }
    }
}
