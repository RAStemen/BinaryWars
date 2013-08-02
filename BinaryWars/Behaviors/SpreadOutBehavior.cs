using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using Microsoft.Xna.Framework;

namespace BinaryWars.Behaviors
{
    public class SpreadOutBehavior : Behavior
    {
        public List<Actor> Crowd;
        

        public SpreadOutBehavior(Actor crowdMember, List<Actor> crowd, float basePriority)
            : base(basePriority)
        {
            CrowdMember = crowdMember;
            Crowd = crowd;
        }

        public Actor CrowdMember { get; private set; }

        public override void Action()
        {
            Actor closestActor = null;
            float tempDistance, minDistance = float.MaxValue;
            SortedList<float, Actor> neighbors = new SortedList<float, Actor>();

            foreach (Actor a in Crowd)
            {
                if (a != CrowdMember)
                {
                    neighbors[BWDirector.Instance.CollisionManager.CollisionMatrix[CrowdMember, a]] = a;

                    //tempDistance = BWDirector.Instance.CollisionManager.CollisionMatrix[CrowdMember, a];
                    //if (tempDistance < minDistance)
                    //{
                    //    closestActor = a;
                    //    minDistance = tempDistance;
                    //}
                }
            }

            if (neighbors.Keys.Count > 0)
            {
                closestActor = neighbors.Values[0];
                Vector2 nextPosition = CrowdMember.Position;
                Vector2 delta = closestActor.Position - nextPosition;

                double angle = Math.Atan2(delta.Y, delta.X) ;

                nextPosition.X = (float)(nextPosition.X - Math.Cos(angle) * Priority);
                nextPosition.Y = (float)(nextPosition.Y - Math.Sin(angle) * Priority);

                CrowdMember.Position = nextPosition;
            }
        }
    }
}
