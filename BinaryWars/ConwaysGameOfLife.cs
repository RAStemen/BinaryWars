using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework;
using BinaryWars;
using XTM;
using BinaryWars.Actors;

namespace BinaryWars
{
    public class ConwaysGameOfLife
    {
        private static byte WHITE = 255;

        private int width;
        private int height;
        private int TextureIdex = -1;
        private byte[] gameState;
        private byte[] nextState;
        private Random random;
        public Texture2D ConwayTexture { get; private set; }
        private GraphicsDevice gd;

        private ResolveTexture2D resolveTex2D;
        private PresentationParameters pp;
        private RenderTarget2D rt2d;
        private Texture2D rayDetailTexture;
        private Texture2D BulletData;
        private int rayRow;
        private Random rand = new Random();

        Effect drawEffect;

        public ConwaysGameOfLife(int width, int height, GraphicsDevice graphicsDevice, Effect drawEffect)
        {
            this.width = width;
            this.height = height;
            gameState = new byte[width * height];
            nextState = new byte[width * height];
            random = new Random();
            gd = graphicsDevice;

            PresentationParameters pp = gd.PresentationParameters;
            resolveTex2D = new ResolveTexture2D(gd, pp.BackBufferWidth, pp.BackBufferHeight, 1, pp.BackBufferFormat);
            rt2d = new RenderTarget2D(gd, pp.BackBufferWidth, pp.BackBufferHeight, 1, pp.BackBufferFormat);

            this.drawEffect = drawEffect;
            
            // Finding the Texture index that for Conway's Game of Life.
            do{
                TextureIdex++;
            } while( gd.Textures[TextureIdex] != null);

            createDefaultTexture();
            //TextureFilter.Anisotropic
        }

        public void createDefaultTexture()
        {
            if ( (ConwayTexture != null) && !ConwayTexture.IsDisposed )
            {
                ConwayTexture.Dispose();
            }
            ConwayTexture = new Texture2D(gd, width, height, 1,
                    TextureUsage.None, SurfaceFormat.Luminance8);
            int x, y, val;
            for (int i = width * height - 1; i >= 0; i--)
            {
                gameState[i] = nextState[i] = 0;
            }

            ConwayTexture.SetData<byte>(gameState); 
        }

        public void updateGameState(){
            byte numberOfNeighborsAlive;
            bool cellAliveNextIteration;
            for( int i = gameState.Length-1; i >= 0; i-- ){            

                numberOfNeighborsAlive = 0;
                for( int j = 0; j < 9; j++ ){
                    int index = i + width*((j/3)-1) + ((j%3)-1);
                    if( (index != i) && (index <= gameState.Length-1) && (index >=0)
                            && (gameState[index] == WHITE) ){
                        numberOfNeighborsAlive++;
                    } 
                }

                cellAliveNextIteration = false;
                if( gameState[i] == WHITE ){
                    if( (numberOfNeighborsAlive == 2) || (numberOfNeighborsAlive == 3) ){
                        cellAliveNextIteration = true;
                    } 
                } else {
                    if( numberOfNeighborsAlive == 3 ){
                        cellAliveNextIteration = true;
                    }
                }     
                int x = i% width;
                int y = i / width;
                float fadeFactor = .80f;
                if( cellAliveNextIteration ){
                    nextState[i] = WHITE;
                } else {
            	    byte color = (byte)(gameState[i]*fadeFactor);
            	    float colorRatio = color/255.0f;
                    nextState[i] = color;
                }
            }
            gameState = (byte[])nextState.Clone();
        }

        private void convertGamestateToTexture2D()
        {
            ConwayTexture.Dispose();
            ConwayTexture = new Texture2D(gd, width, height, 1,
                TextureUsage.None, SurfaceFormat.Luminance8);
            ConwayTexture.SetData<byte>(gameState);
        }

        public void updateGameState(byte numberOfCellsToTurnOn)
        {
            addRandomCells(numberOfCellsToTurnOn);
            TurnOnCellsAtActorPositions();
            updateGameState();
            convertGamestateToTexture2D();

            if (rayDetailTexture == null)
                rayDetailTexture = BWDirector.Instance.StageManager.RayDetailTexture;

            rayRow = (rayRow + 1) % rayDetailTexture.Height;
        }

        public void addRandomCells(byte numberOfCellsToTurnOn)
        {
            int insertLoc;
            for (int i = 0; i < numberOfCellsToTurnOn; i++)
            {
                insertLoc = random.Next(gameState.Length);
                gameState[insertLoc] = WHITE;
            }
        }

        public void TurnOnCellsAtActorPositions()
        {
            BWActor bwActor;
            int insertLoc;
            float xRatio =  (1.0f * width) / BWDirector.Instance.ActorManager.ViewportWidth;
            float yRatio = (1.0f * height) / BWDirector.Instance.ActorManager.ViewportHeight * 1.0f;
            foreach (BWActor actor in BWDirector.Instance.ActorManager)
            {
                bwActor = actor as BWActor;
                insertLoc = ((int)(bwActor.Position.X * xRatio) % (width))
                    + ((int)(actor.Position.Y * yRatio) * width);
                insertLoc = (insertLoc >= gameState.Length) ? gameState.Length - 1 : insertLoc;
                insertLoc = (insertLoc < 0) ? 0 : insertLoc;
                gameState[insertLoc] = WHITE;
            }
        }

        public void CreateBulletDataTexture2D(List<Actor> bList, Vector2 size)
        {
            if (BulletData != null && !BulletData.IsDisposed)
                BulletData.Dispose();
            BulletData = new Texture2D(gd, Math.Max(bList.Count, 1), 1, 1,
                TextureUsage.None, SurfaceFormat.Color);
            int[] data = new int[BulletData.Width];
            data[0] = 0;
            Actor b;
            for (int i = 0; i < bList.Count; i++)
            {
                b = bList[i];
                data[i] = 255 << 24 | (int)((b.Position.X / size.X) * 255) << 16 |
                    (int)((b.Position.Y / size.Y) * 255) << 8 | (int)(255 * rand.NextDouble()) ;
            }
            BulletData.SetData<int>(data);
        }

        public void DrawBackground(SpriteBatch spriteBatch, Texture2D BackgroundTexture, Rectangle drawRectangle)
        {
            List<Vector4> explosions = BWDirector.Instance.StageManager.Explosions;

            Vector3[] impacts = new Vector3[explosions.Count];
            for (int i = 0; i < explosions.Count; i++)
            {
                impacts[i] = new Vector3(explosions[i].X, explosions[i].Y, explosions[i].Z);
            }
            List<Actor> bList = BWDirector.Instance.ActorManager.Bullets;
            CreateBulletDataTexture2D(BWDirector.Instance.ActorManager.Bullets, new Vector2(BackgroundTexture.Width, BackgroundTexture.Height));
            
            Vector3[] bullets = new Vector3[bList.Count()];
            //for (int i = 0; i < bList.Count; i++)
            //{
            //    Bullet b = (Bullet)bList[i];
            //    bullets[i] = new Vector3(b.Position.X / BackgroundTexture.Width, b.Position.Y / BackgroundTexture.Height, (float)rand.NextDouble());
            //}
            

            //impacts[0] = new Vector3(a.Position.X / BackgroundTexture.Width, a.Position.Y / BackgroundTexture.Height, 0.01f);
            //Texture 1 controls the visibility of the Background image.
            gd.Textures[1] = ConwayTexture;

            //setting params
            drawEffect.Parameters["impacts"].SetValue(impacts);
            drawEffect.Parameters["impactCount"].SetValue(impacts.Length);
            //drawEffect.Parameters["bullets"].SetValue(bullets);
            drawEffect.Parameters["bulletCount"].SetValue(bullets.Length);
            drawEffect.Parameters["rayRow"].SetValue((1.0f * rayRow) / rayDetailTexture.Height);
            drawEffect.Parameters["RayDetailTexture"].SetValue(rayDetailTexture);
            drawEffect.Parameters["BulletValuesTexture"].SetValue(BulletData);
            //gd.SetRenderTarget(0, rt2d);
            spriteBatch.Begin(SpriteBlendMode.AlphaBlend, SpriteSortMode.Immediate, SaveStateMode.SaveState);
            spriteBatch.Draw(BackgroundTexture, Vector2.Zero, Color.White);
            drawEffect.Begin();
            drawEffect.CurrentTechnique.Passes[0].Begin();
            drawEffect.CurrentTechnique.Passes[0].End();
            drawEffect.End();
            spriteBatch.End();
            //gd.SetRenderTarget(0, null);

            //gd.ResolveBackBuffer(resolveTex2D);
            //resolveTex2D.Save("backBuffer.jpeg", ImageFileFormat.Jpg);

            //gd.SetRenderTarget(0, rt2d);
            //resolveTex2D.GenerateMipMaps(TextureFilter.Linear);

            spriteBatch.Begin(SpriteBlendMode.None, SpriteSortMode.Immediate, SaveStateMode.None);
            //gd.Textures[0] = resolveTex2D;
            spriteBatch.Draw(BackgroundTexture, Vector2.Zero, Color.White);
            drawEffect.Begin();
            drawEffect.CurrentTechnique.Passes[1].Begin();
            drawEffect.CurrentTechnique.Passes[1].End();
            drawEffect.End();
            spriteBatch.End();

            //gd.ResolveBackBuffer(resolveTex2D);

            //spriteBatch.Begin();
            //spriteBatch.Draw(resolveTex2D, Vector2.Zero, Color.White);
            //spriteBatch.End();
            //gd.SetRenderTarget(0, null);
        }
    }
}
