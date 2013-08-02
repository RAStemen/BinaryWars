using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using XTM.Managers;

namespace BinaryWars.Managers
{
    public delegate void ActorOutOfViewDelegate(Actor actor);

    public class BWMovementManager : MovementManager
    {
        private ActorOutOfViewDelegate OnOutOfView;

        public event ActorOutOfViewDelegate OutOfView
        {
            add { OnOutOfView += value; }
            remove { OnOutOfView -= value; }
        }

        public override void Update()
        {
            BWDirector.Instance.ActorManager.Player.Move();

            if (IsOutOfView(BWDirector.Instance.ActorManager.Player))
            {
                if (OnOutOfView != null)
                {
                    OnOutOfView(BWDirector.Instance.ActorManager.Player);
                }
            }

            foreach (Actor actor in BWDirector.Instance.ActorManager)
            {
                actor.Move();

                if (IsOutOfView(actor))
                {
                    if (OnOutOfView != null)
                    {
                        OnOutOfView(actor);
                    }
                }
            }
        }

        private bool IsOutOfView(Actor actor)
        {
            return actor.Position.X > BWDirector.Instance.ActorManager.ViewportWidth ||
                    actor.Position.X < 0 ||
                    actor.Position.Y > BWDirector.Instance.ActorManager.ViewportHeight ||
                    actor.Position.Y < 0;
        }
    }
}
