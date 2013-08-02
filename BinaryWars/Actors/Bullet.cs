using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using Microsoft.Xna.Framework;

namespace BinaryWars.Actors
{
    public class Bullet : BWActor
    {
        public float Speed { get; set; }
        public double Angle { get; set; }

        public Bullet(Vector2 startLocation, float speed, double angle)
        {
            this.Position = startLocation;
            this.Speed = speed;
            this.Angle = angle;
            this.Radius = 4;

            Behaviors.Add(new BulletBehavior(this, 1.0f));
            
        }


        public override ActorRelationship GetRelationship(Actor other)
        {
            if (other is Zero || other is One)
            {
                return ActorRelationship.Enemy;
            }
            else
            {
                return ActorRelationship.Neutral;
            }
        }
    }
}
