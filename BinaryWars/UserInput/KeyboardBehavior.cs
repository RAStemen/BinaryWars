using System;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Input;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using XTM;

namespace BinaryWars.Behaviors.UserInput
{
    public class KeyboardBehavior : Behavior
    {
        public KeyboardBehavior(Actor player, float priority)
            : base(priority)
        {
            Player = player;
        }

        public Actor Player { get; private set; }

        public override void Action()
        {
            KeyboardState keystate = Keyboard.GetState();

            Player.Position += new Vector2(

                Priority * (((keystate.IsKeyDown(Keys.Right) || keystate.IsKeyDown(Keys.D)) ? 1 : 0)
                          - ((keystate.IsKeyDown(Keys.Left) || keystate.IsKeyDown(Keys.A)) ? 1 : 0)),
                Priority * (((keystate.IsKeyDown(Keys.Down) || keystate.IsKeyDown(Keys.S)) ? 1 : 0)
                          - ((keystate.IsKeyDown(Keys.Up) || keystate.IsKeyDown(Keys.W)) ? 1 : 0))
                
            );
        }
    }
}
