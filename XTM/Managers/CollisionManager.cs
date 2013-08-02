using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace XTM.Managers
{
    public delegate void ActorCollisionDelegate(Actor a, Actor b);

    public abstract class CollisionManager : IManager
    {
        public CollisionManager()
        {
            CollisionMatrix = new Matrix<Actor, float>();
        }

        public Matrix<Actor, float> CollisionMatrix { get; set; }

        protected ActorCollisionDelegate OnCollision;

        public event ActorCollisionDelegate Collision
        {
            add { OnCollision += value; }
            remove { OnCollision -= value; }
        }

        public abstract void Update();
    }
}
