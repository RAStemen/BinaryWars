using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using XTM;
using BinaryWars.Actors;

namespace BinaryWars.Managers
{
    public class BWActorManager : XTM.Managers.ActorManager
    {
        private Vector2[] corners;

        public BWActorManager(int viewportWidth, int viewportHeight, int countThreshold)
        {
            LastSpawn = DateTime.MinValue;
            InterSpawnTime = new TimeSpan(0, 0, 0, 0, 500);
            PositionGenerator = new Random();
            ViewportWidth = viewportWidth;
            ViewportHeight = viewportHeight;
            PendingRemovals = new Queue<Actor>();
            PendingInsertions = new Queue<Actor>();
            CountThreshold = countThreshold;
            Bullets = new List<Actor>();
            Zeroes = new List<Actor>();
            Ones = new List<Actor>();
            Particles = new List<Particle>();

            corners = new Vector2[]
            {
                Vector2.Zero,
                new Vector2( 0, ViewportHeight),
                new Vector2( viewportWidth, 0),
                new Vector2( viewportWidth, viewportHeight)
            };
        }

        public void CollisionManager_Collision(Actor a, Actor b)
        {
            if (a.GetRelationship(b) == ActorRelationship.Enemy)
            {
                PendingRemovals.Enqueue(a);
                PendingRemovals.Enqueue(b);

                //Attempting to Add Particle for Explosion
                GenerateParticles(a.Position);
                BWDirector.Instance.StageManager.Explosions.Add(new Vector4(a.Position.X / ViewportWidth, a.Position.Y / ViewportHeight, .00001f, 1));
            }
            if (a is Player || b is Player)
            {
                LastSpawn = DateTime.Now.AddSeconds(1);
            }
        }

        private void GenerateParticles(Vector2 position)
        {
            Random randomGenerator = new Random();
            int numParticles = randomGenerator.Next(20, 30);
            for (int i = 0; i < numParticles; i++)
            {
                double angle = randomGenerator.Next(0,50)/Math.PI;
                Particle p = new Particle(position, 1, angle);
                PendingInsertions.Enqueue(p);
            }
        }

        public void MovementManager_OutOfView(Actor actor)
        {
            Vector2 position;

            if (actor is Bullet)
            {
                PendingRemovals.Enqueue(actor);
            }
            else
            {
                position = actor.Position;

                if (position.X < 0)
                {
                    position.X = 0;
                }
                else if (position.X > ViewportWidth)
                {
                    position.X = ViewportWidth;
                }

                if (position.Y < 0)
                {
                    position.Y = 0;
                }
                else if (position.Y > ViewportHeight)
                {
                    position.Y = ViewportHeight;
                }

                actor.Position = position;
            }
        }

        public void Instance_GameEnded()
        {
            Player.Behaviors.Clear();
        }

        public void Instance_GameStarted()
        {
            Bullets.Clear();
            Zeroes.Clear();
            Ones.Clear();
            Particles.Clear();

            PendingInsertions.Clear();
            PendingRemovals.Clear();

            RespawnPlayer();
        }

        public Player Player { get; set; }

        public int ViewportWidth { get; set; }

        public int ViewportHeight { get; set; }

        public Random PositionGenerator { get; set; }

        public DateTime LastSpawn { get; set; }

        public TimeSpan InterSpawnTime { get; set; }

        public Queue<Actor> PendingRemovals { get; set; }

        public Queue<Actor> PendingInsertions { get; set; }

        public int CountThreshold { get; set; }

        public List<Actor> Bullets { get; set; }

        public List<Actor> Zeroes { get; set; }

        public List<Actor> Ones { get; set; }

        public List<Particle> Particles { get; set; }

        public override void Update()
        {
            for (int i = 0; i < Particles.Count && (Particles[i] as Particle).Expiration < DateTime.Now; i++) 
            {
                PendingRemovals.Enqueue(Particles[i]);
            }

            while (PendingInsertions.Count > 0)
            {
                AddActor(PendingInsertions.Dequeue());
            }

            if (DateTime.Now - LastSpawn > InterSpawnTime && this.Count() < CountThreshold)
            {
                Vector2 spawnPoint = corners[PositionGenerator.Next(4)];

                if (PositionGenerator.Next(2) == 0)
                {
                    Zero zero = new Zero();
                    zero.Position = spawnPoint;
                    AddActor(zero);
                }
                else
                {
                    One one = new One();
                    one.Position = spawnPoint;
                    AddActor(one);
                }
                LastSpawn = DateTime.Now;
            }

            while (PendingRemovals.Count > 0)
            {
                this.Remove(PendingRemovals.Dequeue());
            }
        }

        public void Remove(Actor actor)
        {
            if (actor is Bullet)
            {
                Bullets.Remove(actor as Bullet);
            }
            else if (actor is Zero)
            {
                Zeroes.Remove(actor as Zero);
            }
            else if (actor is One)
            {
                Ones.Remove(actor as One);
            }
            else
            {
                Particles.Remove(actor as Particle);
            }
        }

        private void AddActor(Actor actor)
        {
            if (actor is Bullet)
            {
                Bullets.Add(actor);
            }
            else if (actor is Zero)
            {
                Zeroes.Add(actor);
            }
            else if (actor is One)
            {
                Ones.Add(actor);
            }
            else
            {
                BinaryInsert(Particles,actor as Particle);
            }

            if (!(actor is Particle))
            {
                BWDirector.Instance.CollisionManager.PendingInsertions.Enqueue(actor);
            }
        }

        private void BinaryInsert(List<Particle> particleList, Particle particle)
        {
            int index = particleList.BinarySearch(particle);

            if (index < 0)
            {
                particleList.Insert(-index - 1, particle);
            }
        }

        public override IEnumerator<Actor> GetEnumerator()
        {
            foreach (Actor a in Bullets)
            {
                yield return a;
            }

            foreach (Actor a in Zeroes)
            {
                yield return a;
            }

            foreach (Actor a in Ones)
            {
                yield return a;
            }

            foreach (Actor a in Particles)
            {
                yield return a;
            }
        }

        public void RespawnPlayer()
        {
            Player = new Player();
            Player.Position = new Vector2(ViewportWidth / 2, ViewportHeight / 2);
            BWDirector.Instance.CollisionManager.PendingInsertions.Enqueue(Player);
        }
    }
}
