# Rejected AI stories

Written by `tools/generate_story.py`. Each entry is an AI reply the safety checks stopped; the child got the fallback.

## 2026-11-15 04:54 · CX 500 2026-11-14 · 6-8

Reasons:
- missing chapter versions: 1 both, 2 on_time, 2 delayed, 3 on_time, 3 delayed, 4 on_time

Raw reply:

```json
{"title": {"en": "A journey to Tokyo awaits"}, "chapters": [
{"number": 1, "key": "checkin", "branch": "both", "unlockOn": "junior_mode_on", "text": {"en": {"title": "The adventure begins with Pip", "pages": ["Pip flutters by as you check in. “Tokyo! How exciting!” he chirps. “Can I come too, {name}?” You smile and nod. Pip hops on your shoulder. You both feel ready for fun!"]}},
  
  	"number": 2, "key": "boarding", "branch": "on_time", "unlockOn": "boarded", "text": {"en": {"title": "Time to board the plane", "pages": ["You reach the gate and see the airplane. Pip fluffs his feathers. “Look how big it is!” he sings. You show your ticket. Soon, it’s time to go!"]}},
  
 	"number": 2, "key": "boarding", "branch": "delayed", "unlockOn": "boarded", "text": {"en": {"title": "Extra time at the gate", "pages": ["Oh dear, there’s a little delay. Pip chirps, “More time to explore!” You wander near the window. You watch the planes take off for Tokyo!"]}},
  
 	"number": 3, "key": "inflight", "branch": "on_time", "unlockOn": "departed", "text": {"en": {"title": "Flying high in the sky", "pages": ["The plane takes off, and you feel the lift. Pip is excited! “Look at the clouds!” he tweets. You both wave to the fluffy clouds below!"]}},
  
 	"number": 3, "key": "inflight", "branch": "delayed", "unlockOn": "departed", "text": {"en": {"title": "More time in the air", "pages": ["The plane has a little delay in the sky. “We have time to watch clouds,” Pip says. You enjoy snacks and smile at all the fluffy shapes!"]}},
  
 	"number": 4, "key": "landing", "branch": "on_time", "unlockOn": "landed", "text": {"en": {"title": "Arriving in Tokyo", "pages": ["The airplane lands softly. “We made it, {name}!” Pip flaps his wings. You feel the excitement of a new place. The adventure is just beginning!"]}},
  
 	"number": 4, "key": "landing", "branch": "delayed", "unlockOn": "landed", "text": {"en": {"title": "Finally in Tokyo", "pages": ["The plane lands gently. “What a journey, {name}!” chirps Pip. The extra time in the sky was fun. You’re ready for new adventures in Tokyo!"]}}
  
  }
]}
```

## 2026-11-15 04:54 · CX 500 2026-11-14 · 6-8

Reasons:
- wrong shape: chapters.1.text.en.pages: List should have at most 3 items after validation, not 4; chapters.2.text.en.pages: List should have at most 3 items after validation, not 4; chapters.3.text.en.pages: List should have at most 3 items after validation, not 4

Raw reply:

```json
{"title": {"en": "A Journey to Tokyo with Pip"}, "chapters": [
{"number": 1, "key": "checkin", "branch": "both", "unlockOn": "junior_mode_on", "text": {"en": {"title": "The Trip Begins with Pip", "pages": ["Pip flutters near the check-in desk. \"Look, {name}, our trip is starting!\"","He hops closer to you with a big smile. \"Can I come too?\"","You nod excitedly, hugging your ticket tight. \"Yes, Pip! We’re off to Tokyo!\""]}}},
{"number": 2, "key": "boarding", "branch": "on_time", "unlockOn": "boarded", "text": {"en": {"title": "Time to Board the Plane", "pages": ["At gate {gate}, it’s time to board the plane!","Pip chirps happily. \"Look at the big plane, {name}!\"","You skip towards the door, ready for the adventure.","Pip flies beside you, excited to be on board."]}}},
{"number": 2, "key": "boarding", "branch": "delayed", "unlockOn": "boarded", "text": {"en": {"title": "A Surprise Delay for More Fun", "pages": ["At gate {gate}, there is a little delay today.","Pip hops with joy. \"More time for fun, {name}!\"","You play with your toys, laughing with Pip by your side.","The plane will wait, giving us time to enjoy!"]}}},
{"number": 3, "key": "inflight", "branch": "on_time", "unlockOn": "departed", "text": {"en": {"title": "Soaring Above the Clouds", "pages": ["The plane takes off into the bright blue sky.","Pip looks out the window with big eyes. \"Look, {name}!\"", "Fluffy clouds dance below us, like cotton candy.","You giggle as Pip pretends to fly outside the plane."]}}},
{"number": 3, "key": "inflight", "branch": "delayed", "unlockOn": "departed", "text": {"en": {"title": "Extra Time Among the Clouds", "pages": ["The plane flies smoothly, but there's a little delay.","Pip is excited. \"More time to look at clouds, {name}!\"","You gaze out, spotting shapes in the fluffy whiteness.","Together you count the clouds like playful friends."]}}},
{"number": 4, "key": "landing", "branch": "on_time", "unlockOn": "landed", "text": {"en": {"title": "Touching Down in Tokyo", "pages": ["The plane lands softly on the ground of {city}.","Pip flaps his wings with joy. \"We made it, {name}!\"","Tall buildings and bright lights greet you both.","You can’t wait to explore this new place together!"]}}},
{"number": 4, "key": "landing", "branch": "delayed", "unlockOn": "landed", "text": {"en": {"title": "A Smooth Landing in Tokyo", "pages": ["The plane lands gently in {city}, a little later than planned.","Pip smiles wide. \"We still made it, {name}!\"","The bright lights shine as you step outside the plane.","Adventure awaits, and you are ready with Pip!"]}}
}] }
```
