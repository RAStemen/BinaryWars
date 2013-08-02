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
    public class One : BWActor
    {
        public static Random RandomGenerator = new Random();

        public One()
        {
            Radius = 16;
            float difficultyMulitplier = BWDirector.Instance.PriorityMultiplier;
            Behaviors.Add(new ChaseBehavior(this,
                BWDirector.Instance.ActorManager.Player, 2.5f * difficultyMulitplier));
            //Behaviors.Add(new SpreadOutBehavior(this,
            //    BWDirector.Instance.ActorManager.Ones, 1.0f));
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
