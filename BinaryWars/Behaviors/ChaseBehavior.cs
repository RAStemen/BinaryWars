using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using BinaryWars.Behaviors;
using XTM;
using Microsoft.Xna.Framework;

namespace BinaryWars
{
    public class ChaseBehavior : BWBehavior
    {
        public ChaseBehavior(Actor chaser, Actor target, float basePriority)
            : base(basePriority)
        {
            Chaser = chaser;
            Target = target;
        }

        public Actor Chaser { get; private set; }
        public Actor Target { get; private set; }

        public override void Action()
        {
            Vector2 nextPosition = Chaser.Position;
            Vector2 delta = Chaser.Position - Target.Position;
            Angle = Math.Atan2(delta.Y, delta.X);

            nextPosition.X = (float)(nextPosition.X - Math.Cos(Angle) * Priority);
            nextPosition.Y = (float)(nextPosition.Y - Math.Sin(Angle) * Priority);

            Chaser.Position = nextPosition;
        }
    }
}
