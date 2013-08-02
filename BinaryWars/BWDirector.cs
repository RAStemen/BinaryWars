using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using XTM;
using BinaryWars.Actors;
using BinaryWars.Managers;

namespace BinaryWars
{
    public delegate void GameStateChangedDelegate();

    public class BWDirector : Director<BWMovementManager, BWCollisionManager, BWActorManager, BWStageManager, BWMenuManager>
    {
        public const byte MaxLives = 5;
        public const byte BasePointsPerKill = 128;

        public static BWDirector Instance;

        private GameStateChangedDelegate onStartGame;
        private GameStateChangedDelegate onEndGame;
        private ulong targetScore;

        public void Start()
        {
            PointsPerKill = BasePointsPerKill;
            Lives = MaxLives;

            targetScore = 40 * PointsPerKill;
            Multiplier = 1;
            PriorityMultiplier = 1;
            Score = 0;

            CGOL.createDefaultTexture();

            if (onStartGame != null)
            {
                onStartGame();
            }
        }

        public float PriorityMultiplier { get; private set; }
        public uint PointsPerKill { get; set; }
        public ulong Score { get; set; }
        public ulong Multiplier { get; set; }
        public byte Lives { get; set; }
        public ConwaysGameOfLife CGOL { get; set; }

        public event GameStateChangedDelegate GameEnded
        {
            add { onEndGame += value; }
            remove { onEndGame -= value; }
        }

        public event GameStateChangedDelegate GameStarted
        {
            add { onStartGame += value; }
            remove { onStartGame -= value; }
        }

        public void CollisionManager_Collision(Actor a, Actor b)
        {
            if (a is Player || b is Player)
            {
                if (Lives == 0 && onEndGame != null)
                {
                    onEndGame();
                }
                else
                {
                    Lives--;
                    ClearScreen();
                    ActorManager.RespawnPlayer();
                }
            }
            else if(a.GetRelationship(b) == ActorRelationship.Enemy)
            {
                Score += Multiplier * PointsPerKill;
                if (Score > targetScore)
                {
                    targetScore *= 4;
                    PriorityMultiplier *= 1.25f;
                    Multiplier *= 2;
                }
            }
        }

        private void ClearScreen()
        {
            foreach (Actor a in ActorManager.Bullets)
            {
                ActorManager.PendingRemovals.Enqueue(a);
            }

            foreach (Actor a in ActorManager.Zeroes)
            {
                ActorManager.PendingRemovals.Enqueue(a);
            }

            foreach (Actor a in ActorManager.Ones)
            {
                ActorManager.PendingRemovals.Enqueue(a);
            }

            foreach (Actor a in CollisionManager.CollisionMatrix)
            {
                CollisionManager.PendingRemovals.Enqueue(a);
            }
        }

        public override void Draw()
        {
            StageManager.Update();
            MenuManager.Update();
        }

        public override void Update()
        {
            MovementManager.Update();
            CollisionManager.Update();
            ActorManager.Update();
        }
    }
}
