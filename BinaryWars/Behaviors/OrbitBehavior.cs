using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using BinaryWars.Behaviors;
using XTM;
using Microsoft.Xna.Framework;

namespace BinaryWars
{
    class OrbitBehavior : BWBehavior
    {
        private bool orbitBehavior;
        public OrbitBehavior(Actor orbiter, Actor target, bool orbitBehavior, float basePriority)
            : base(basePriority)
        {
            Orbiter = orbiter;
            Target = target;
            this.orbitBehavior = orbitBehavior;
        }

        public Actor Orbiter { get; private set; }
        public Actor Target { get; private set; }

        public override void Action()
        {
            Vector2 nextPosition = Orbiter.Position;
            Vector2 delta = Orbiter.Position - Target.Position;
            Angle = Math.Atan2(delta.Y, delta.X);
            Angle = orbitBehavior ? Angle - Math.PI / 2 : Angle + Math.PI / 2;

            nextPosition.X = (float)(nextPosition.X - Math.Cos(Angle) * Priority);
            nextPosition.Y = (float)(nextPosition.Y - Math.Sin(Angle) * Priority);

            Orbiter.Position = nextPosition;
        }
    }
}
