using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.GamerServices;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using Microsoft.Xna.Framework.Media;
using Microsoft.Xna.Framework.Net;
using Microsoft.Xna.Framework.Storage;
using XTM.Managers;

namespace XTM
{
    public abstract class Director<TMovement, TCollision, TActor, TStage, TMenu>
        where TMovement : MovementManager
        where TCollision : CollisionManager
        where TActor : ActorManager
        where TStage : StageManager
        where TMenu : MenuManager
    {
        public TMovement MovementManager { get; set; }
        public TCollision CollisionManager { get; set; }
        public TActor ActorManager { get; set; }
        public TStage StageManager { get; set; }
        public TMenu MenuManager { get; set; }

        public abstract void Update();
        public abstract void Draw();
    }
}
