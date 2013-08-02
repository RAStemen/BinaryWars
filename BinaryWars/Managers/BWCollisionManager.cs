using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using XTM;
using BinaryWars.Actors;

namespace BinaryWars.Managers
{
    public class BWCollisionManager : XTM.Managers.CollisionManager
    {
        public BWCollisionManager()
        {
            PendingRemovals = new Queue<Actor>();
            PendingInsertions = new Queue<Actor>();

            Collision += new XTM.Managers.ActorCollisionDelegate(BWCollisionManager_Collision);
        }

        public void Instance_GameStarted()
        {
            CollisionMatrix.Clear();
            CollisionMatrix.Combinations.Clear();

            PendingInsertions.Clear();
            PendingRemovals.Clear();
        }

        void BWCollisionManager_Collision(Actor a, Actor b)
        {
            if (a.GetRelationship(b) == ActorRelationship.Enemy)
            {
                PendingRemovals.Enqueue(a);
                PendingRemovals.Enqueue(b);
            }
        }

        public void MovementManager_OutOfView(Actor actor)
        {
            if (actor is Bullet)
            {
                PendingRemovals.Enqueue(actor);
            }
        }

        public Queue<Actor> PendingRemovals { get; set; }

        public Queue<Actor> PendingInsertions { get; set; }

        public override void Update()
        {
            while (PendingInsertions.Count > 0)
            {
                CollisionMatrix.Add(PendingInsertions.Dequeue());
            }

            int index = 0;

            for (int i = 0; i < CollisionMatrix.Count; i++)
            {
                for (int j = 0; j < i; j++)
                {
                    BWActor a = CollisionMatrix[i] as BWActor;
                    BWActor b = CollisionMatrix[j] as BWActor;

                    if (a.GetRelationship(b) != ActorRelationship.Neutral)
                    {
                        float distance = ((ICombinable<Actor, float>)a).Combine(b);
                        CollisionMatrix.Combinations[index++] = distance;

                        if (a.Radius + b.Radius >= distance)
                        {
                            if (OnCollision != null)
                            {
                                OnCollision(a, b);
                            }
                        }
                    }
                }
            }

            while (PendingRemovals.Count > 0)
            {
                CollisionMatrix.Remove(PendingRemovals.Dequeue());
            }
        }
    }
}
