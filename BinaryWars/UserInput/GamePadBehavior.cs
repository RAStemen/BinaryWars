using System;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;
using BinaryWars.Actors;

namespace BinaryWars.Behaviors.UserInput
{
    public class GamePadBehavior : Behavior
    {

        private int temperature;
        private int cooldownTime;
        bool fireNow = true;

        public GamePadBehavior(Actor player, float priority, int cooldownTime)
            : base(priority)
        {
            Player = player;
            temperature = 0;
            this.cooldownTime = cooldownTime;
        }

        public Actor Player { get; private set; }

        public override void Action()
        {
            GamePadState gamePadState = GamePad.GetState(PlayerIndex.One);
            temperature++;

            //Moving the Player
            Player.Position += new Vector2(
                Priority * gamePadState.ThumbSticks.Left.X,
                Priority * (-gamePadState.ThumbSticks.Left.Y) );

            Vector2 shootVector = new Vector2(
                -gamePadState.ThumbSticks.Right.X,
                gamePadState.ThumbSticks.Right.Y);

            //Shooting
            if (shootVector != Vector2.Zero && temperature % cooldownTime == 0)
            {
                double angle = Math.Atan2(shootVector.Y, shootVector.X);

                if (BWDirector.Instance.Multiplier >= 2 && BWDirector.Instance.Multiplier < 4)
                {
                    double angle1 = angle + (5 * (Math.PI / 180));
                    double angle2 = angle - (5 * (Math.PI / 180));

                    Bullet singleBullet = new Bullet(Player.Position, 11.0f, angle);
                    BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(singleBullet);

                    if (fireNow)
                    {
                        Bullet bullet1 = new Bullet(Player.Position, 11.0f, angle1);
                        BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(bullet1);
                        Bullet bullet2 = new Bullet(Player.Position, 11.0f, angle2);
                        BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(bullet2);
                        fireNow = false;
                    }
                    else
                    {
                        fireNow = true;
                    }
                }
                else if (BWDirector.Instance.Multiplier >= 4)
                {
                    Bullet singleBullet = new Bullet(Player.Position, 12.0f, angle);
                    BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(singleBullet);

                    //Making a bullet that moves in a Sine wave.
                    Bullet bullet1 = new Bullet(Player.Position, 6.0f, angle);
                    bullet1.Behaviors.Add(new WaveBehavior(bullet1, bullet1.Behaviors.ElementAt(0) as BWBehavior, false, .6f, 15));
                    BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(bullet1);

                }
                else
                {
                    Bullet singleBullet = new Bullet(Player.Position, 10.0f, angle);
                    BWDirector.Instance.ActorManager.PendingInsertions.Enqueue(singleBullet);
                }
            }
        }
    }
}
