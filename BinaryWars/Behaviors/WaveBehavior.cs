using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using BinaryWars.Actors;
using BinaryWars.Behaviors;

namespace BinaryWars
{
    public class WaveBehavior : BWBehavior
    {
        private float counter = 0;
        private float frequency;
        private BWBehavior behaviorToModify;
        private bool sineWave;

        public WaveBehavior(BWActor actor, BWBehavior behaviorToModify,
            bool sineWave, float frequency, float amplitude) : base(amplitude)
        {
            this.behaviorToModify = behaviorToModify;
            this.sineWave = sineWave;
            this.frequency = frequency;
            Actor = actor;
        }

        public BWActor Actor { get; private set; }

        public override void Action()
        {
            Vector2 nextPosition = Actor.Position;

            counter += frequency;


            Angle = sineWave ? behaviorToModify.Angle + ((Math.PI / 2) * Math.Sin(counter)) :
                behaviorToModify.Angle + ((Math.PI / 2) * Math.Cos(counter));

            nextPosition.X = (float)(nextPosition.X - Math.Cos(Angle) * Priority);
            nextPosition.Y = (float)(nextPosition.Y - Math.Sin(Angle) * Priority);

            Actor.Position = nextPosition;
        }
    }
}
