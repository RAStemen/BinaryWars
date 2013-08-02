using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using Microsoft.Xna.Framework;
using BinaryWars.Actors;
using BinaryWars.Behaviors;

namespace BinaryWars
{
    public class ParticleBehavior : BWBehavior
    {
        public Particle Particle { get; private set; }

        public ParticleBehavior(Particle particle, float basePriority)
            : base(basePriority)
        {
            Particle = particle;
            Angle = particle.Angle;
        }

        public override void Action()
        {
            Vector2 nextPosition = Particle.Position;

            Particle.Rotation += (float)(Math.PI / 110);

            nextPosition.X = (float)(nextPosition.X - Math.Cos(Angle) * Priority * Particle.Speed);
            nextPosition.Y = (float)(nextPosition.Y - Math.Sin(Angle) * Priority * Particle.Speed);

            Particle.Position = nextPosition;
        }
    }
}
