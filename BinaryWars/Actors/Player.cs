using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using BinaryWars.Behaviors.UserInput;

namespace BinaryWars.Actors
{
    public class Player : BWActor
    {
        public Player()
        {
            Radius = 16;
            Behaviors.Add(new KeyboardBehavior(this, 5));
            Behaviors.Add(new GamePadBehavior(this, 5, 6));
            Behaviors.Add(new MouseBehavior(this, 1, 6));
        }

        public override ActorRelationship GetRelationship(Actor other)
        {
            if (other is Zero || other is One)
            {
                return ActorRelationship.Enemy;
            }
            else if (other is Player)
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
