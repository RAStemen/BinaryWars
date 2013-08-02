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
using XTM;
using XTM.Managers;
using BinaryWars.Actors;
using BinaryWars.Managers;

namespace BinaryWars
{
    /// <summary>
    /// This is the main type for your game
    /// </summary>
    public class Game1 : Microsoft.Xna.Framework.Game
    {
        GraphicsDeviceManager graphics;
        SpriteBatch spriteBatch;
        Texture2D playerTexture;
        Texture2D zeroTexture;
        Texture2D oneTexture;
        Texture2D bulletTexture;
        Texture2D crosshairTexture;
        Texture2D particleTexture;
        Texture2D backgroundTexture;
        Texture2D rayDetailTexture;

        Song song;
        DateTime replayTime;
        SpriteFont font;
        Effect backgroundEffect;
        Rectangle CGOLRectangle;

        public Game1()
        {
            graphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = "Content";
        }

        /// <summary>
        /// Allows the game to perform any initialization it needs to before starting to run.
        /// This is where it can query for any required services and load any non-graphic
        /// related content.  Calling base.Initialize will enumerate through any components
        /// and initialize them as well.
        /// </summary>
        protected override void Initialize()
        {
            // TODO: Add your initialization logic here
            replayTime = DateTime.MinValue;

            BWDirector.Instance = new BWDirector();
   
            BWDirector.Instance.ActorManager = new BWActorManager(GraphicsDevice.Viewport.Width, GraphicsDevice.Viewport.Height, 100);
            BWDirector.Instance.CollisionManager = new BWCollisionManager();
            BWDirector.Instance.MovementManager = new BWMovementManager();

            BWDirector.Instance.CollisionManager.Collision += BWDirector.Instance.ActorManager.CollisionManager_Collision;
            BWDirector.Instance.CollisionManager.Collision += BWDirector.Instance.CollisionManager_Collision;

            BWDirector.Instance.MovementManager.OutOfView += BWDirector.Instance.ActorManager.MovementManager_OutOfView;
            BWDirector.Instance.MovementManager.OutOfView += BWDirector.Instance.CollisionManager.MovementManager_OutOfView;

            BWDirector.Instance.GameStarted += BWDirector.Instance.CollisionManager.Instance_GameStarted;
            BWDirector.Instance.GameStarted += BWDirector.Instance.ActorManager.Instance_GameStarted;

            BWDirector.Instance.GameEnded += BWDirector.Instance.ActorManager.Instance_GameEnded;

            CGOLRectangle = new Rectangle(0, 0, this.Window.ClientBounds.Width, this.Window.ClientBounds.Height);

            base.Initialize();
        }

        /// <summary>
        /// LoadContent will be called once per game and is the place to load
        /// all of your content.
        /// </summary>
        protected override void LoadContent()
        {
            // Create a new SpriteBatch, which can be used to draw textures.
            spriteBatch = new SpriteBatch(GraphicsDevice);

            backgroundEffect = Content.Load<Effect>("BackgroundSeeThrough");
            BWDirector.Instance.CGOL = new ConwaysGameOfLife(100, 75, GraphicsDevice, backgroundEffect);

            playerTexture = Content.Load<Texture2D>("Textures\\Player");
            zeroTexture = Content.Load<Texture2D>("Textures\\Zero");
            oneTexture = Content.Load<Texture2D>("Textures\\One");
            bulletTexture = Content.Load<Texture2D>("Textures\\Bullet");
            crosshairTexture = Content.Load<Texture2D>("Textures\\Crosshair");
            particleTexture = Content.Load<Texture2D>("Textures\\Particle");
            backgroundTexture = Content.Load<Texture2D>("Textures\\Background");
            rayDetailTexture = Content.Load<Texture2D>("Textures\\rayData3");
            font = Content.Load<SpriteFont>("BWSpriteFont");
            song = Content.Load<Song>("WhatIsLove");

            BWDirector.Instance.MenuManager = new BWMenuManager(GraphicsDevice, spriteBatch, font);
            BWDirector.Instance.MenuManager.ExitGameMenu.ExitButton.MouseOver += ExitButton_MouseOver;

            BWDirector.Instance.GameEnded += BWDirector.Instance.MenuManager.Instance_GameEnded;
            BWDirector.Instance.StageManager = new BWStageManager(spriteBatch, playerTexture, zeroTexture, oneTexture, bulletTexture, particleTexture, rayDetailTexture);
            BWDirector.Instance.Start();
        }

        /// <summary>
        /// UnloadContent will be called once per game and is the place to unload
        /// all content.
        /// </summary>
        protected override void UnloadContent()
        {
            // TODO: Unload any non ContentManager content here
            playerTexture.Dispose();
            zeroTexture.Dispose();
            oneTexture.Dispose();
            bulletTexture.Dispose();
            crosshairTexture.Dispose();
            particleTexture.Dispose();
            BWDirector.Instance.CGOL.ConwayTexture.Dispose();
            backgroundTexture.Dispose();
            backgroundEffect.Dispose();
        }

        /// <summary>
        /// Allows the game to run logic such as updating the world,
        /// checking for collisions, gathering input, and playing audio.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Update(GameTime gameTime)
        {
            if (DateTime.Now > replayTime)
            {
                replayTime = DateTime.Now + song.Duration;
                //MediaPlayer.Play(song);
            }

            KeyboardState keystate = Keyboard.GetState();            

            // Allows the game to exit
            if (GamePad.GetState(PlayerIndex.One).Buttons.Back == ButtonState.Pressed || keystate.IsKeyDown(Keys.Escape))
            {
                this.Exit();
            }

            BWDirector.Instance.Update();

            BWDirector.Instance.CGOL.updateGameState(5);
            base.Update(gameTime);
        }

        /// <summary>
        /// This is called when the game should draw itself.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Draw(GameTime gameTime)
        {
            MouseState mouseState = Mouse.GetState();
            Vector2 mousePos = new Vector2(mouseState.X-16, mouseState.Y-16);
            graphics.GraphicsDevice.Clear(Color.Black);

            //Drawing the background in its current state.
            BWDirector.Instance.CGOL.DrawBackground(spriteBatch, backgroundTexture, CGOLRectangle);

            spriteBatch.Begin();
            BWDirector.Instance.Draw();
            spriteBatch.Draw(crosshairTexture, mousePos, Color.White);

            string displayText = String.Format("Multiplier: {0}  Score: {1}  Lives: {2}",
                    BWDirector.Instance.Multiplier,
                    BWDirector.Instance.Score,
                    BWDirector.Instance.Lives);

            spriteBatch.DrawString(font, displayText, Vector2.Zero, Color.White);
            spriteBatch.End();

            base.Draw(gameTime);
        }

        private void ExitButton_MouseOver(MouseState mouse)
        {
            if (mouse.LeftButton == ButtonState.Pressed)
            {
                this.Exit();
            }
        }
    }
}
