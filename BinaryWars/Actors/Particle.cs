using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using Microsoft.Xna.Framework;

namespace BinaryWars.Actors
{
    public class Particle : BWActor , IComparable<Particle>
    {
        static Random randGenerator = new Random();
        public float Speed { get; set; }
        public double Angle { get; set; }
        public DateTime Expiration { get; set; }
        public float Rotation { get; set; }

        public Particle(Vector2 startLocation, float speed, double angle)
        {
            int timeInFuture = randGenerator.Next(100,500);
            Expiration = DateTime.Now.AddMilliseconds(timeInFuture);

            this.Rotation = (float)(randGenerator.NextDouble() * 2 * Math.PI);

            this.Position = startLocation;
            this.Speed = speed;
            this.Angle = angle;

            

            Behaviors.Add(new ParticleBehavior(this, 5.0f));
        }


        public override ActorRelationship GetRelationship(Actor other)
        {
            return ActorRelationship.Neutral;
        }

        #region IComparable<Particle> Members

        public int CompareTo(Particle other)
        {
            return this.Expiration.CompareTo(other.Expiration);
        }

        #endregion

    }
}
