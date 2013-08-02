using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using XTM;
using XTM.Managers;
using BinaryWars.Behaviors;

namespace BinaryWars.Actors
{
    public class Zero : BWActor
    {
        public static Random RandomGenerator = new Random();

        public Zero()
        {
            Radius = 16;
            float difficultyMulitplier = BWDirector.Instance.PriorityMultiplier;
            bool orbitClockwise = (RandomGenerator.Next(2) == 0) ? true : false;
            Behaviors.Add(new ChaseBehavior(this,
                BWDirector.Instance.ActorManager.Player, 2 * difficultyMulitplier));
            Behaviors.Add(new OrbitBehavior(this, BWDirector.Instance.ActorManager.Player, 
                orbitClockwise, 3 * difficultyMulitplier));
        }

        public override ActorRelationship GetRelationship(Actor other)
        {
            if (other is Player || other is Bullet)
            {
                return ActorRelationship.Enemy;
            }
            else if (other is Zero || other is One)
            {
                return ActorRelationship.Ally;
            }
            else
            {
                return ActorRelationship.Neutral;
            }
        }
    }
}
