using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using XTM;
using BinaryWars.Actors;

namespace BinaryWars.Managers
{
    public class BWStageManager : XTM.Managers.StageManager
    {
        public List<Vector4> Explosions = new List<Vector4>();
        public static float MAX_EXPLOSION_SIZE = 0.05f;

        public BWStageManager(SpriteBatch batch, Texture2D player, Texture2D zero, 
            Texture2D one, Texture2D bullet, Texture2D particle, Texture2D rayDetailTexture)
            : base(batch)
        {
            PlayerTexure = player;
            ZeroTexure = zero;
            OneTexure = one;
            BulletTexture = bullet;
            ParticleTexture = particle;
            RayDetailTexture = rayDetailTexture;
        }

        public Texture2D PlayerTexure { get; set; }
        public Texture2D ZeroTexure { get; set; }
        public Texture2D OneTexure { get; set; }
        public Texture2D BulletTexture { get; set; }
        public Texture2D ParticleTexture { get; set; }
        public Texture2D RayDetailTexture { get; set; }

        public override void Update()
        {
            DrawActor(BWDirector.Instance.ActorManager.Player);

            foreach (Actor actor in BWDirector.Instance.ActorManager)
            {
                DrawActor(actor);
            }

            for(int i = 0; i < Explosions.Count; i++)
            {
                Vector4 explosion  = Explosions[i];
                if (explosion.W == 1)
                {
                    explosion.Z += MAX_EXPLOSION_SIZE / 3f;
                    if (explosion.Z >= MAX_EXPLOSION_SIZE)
                    {
                        explosion.W = 0;
                    }
                    Explosions[i] = explosion;
                }
                else
                {
                    explosion.Z *= .9f;
                    Explosions[i] = explosion;
                    if (explosion.Z < 0.000001)
                    {
                        Explosions.Remove(explosion);
                        i--;
                    }
                }
            }
        }

        public void DrawActor(Actor actor)
        {
            Texture2D texture;
            Color color = Color.White;

            float rotation = -1;

            if (actor is Player)
            {
                color = Color.Turquoise;
                texture = PlayerTexure;
            }
            else if (actor is Zero)
            {
                color = Color.LawnGreen;
                texture = ZeroTexure;
            }
            else if (actor is Bullet)
            {
                color = Color.White;
                texture = BulletTexture;
            }
            else if (actor is Particle)
            {
                TimeSpan timeLeft = DateTime.Now - (actor as Particle).Expiration;
                color = Color.Lerp(Color.Black, Color.GreenYellow, (float)Math.Min(Math.Abs(timeLeft.TotalMilliseconds/100), 1.0));
                texture = ParticleTexture;
                rotation = (actor as Particle).Rotation;
            }
            else
            {
                color = Color.SpringGreen;
                texture = OneTexure;
            }

            if (rotation != -1)
            {
                SpriteBatch.Draw(texture, new Vector2(actor.Position.X + texture.Width / 2,
                    actor.Position.Y + texture.Height / 2), null, color, rotation,
                    new Vector2(texture.Width / 2, texture.Height / 2),
                    new Vector2(1, 1), SpriteEffects.None, 0);
            }
            else
            {
                SpriteBatch.Draw(texture,
                    new Vector2(
                        actor.Position.X - texture.Width / 2,
                        actor.Position.Y - texture.Height / 2),
                        color);
            }
        }
    }
}
