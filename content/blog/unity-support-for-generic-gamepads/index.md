---
title: "Unity Support for Generic Gamepads"
date: 2025-07-14
draft: false
tags: ["unity","coding", "tutorial", "game development","tips"]
authors: ['Tim I Hely', 'Colin (miniscule)']
images: ["images/blog/pexels-tima-miroshnichenko.jpg"]
---

Out-of-the-box, Unity (among other engines) seems to only want to use Xinput-devices for inputs (like gamepads) in the Input Manage, which means that it doesn't know how to talk to older, generic input devices by default. We learned this the hard way while trying to set up our Demo Arcade Machine.

After some experimentation, Colin (miniscule) figured out a solution which, even if you are not submitting a game for us to use in out demos, we still want to show you how to fix so that anyone, with any kind of controller, can play your game.

<!-- more -->

In order to support the controller you will need to type in the button paths manually on each binding. The bindings all start with:

```unity
<HID:: USB Gamepad          >/
```

⚠ Yes that’s *10 spaces* between Gamepad and ‘>’, yes from what I can tell you do need *exactly* 10 for it to work.

Afterwards you specify the button at the end, for example:

```unity
<HID:: USB Gamepad          >/button3
```

If done correctly it should show up in your bindings list formatted like:

```unity
Button 3 [ USB Gamepad          ]
```

If it shows up more like this:

```unity
button3 [HID:: USB Gamepad         ]
```

..then you’ve made a mistake, likely in the number of spaces.

The following are the button names and their corresponding buttons on the controller (using PS2 names)

<dl class="row ">
<dt class="col-md-2 ">Triangle</dt>
<dd class="col-md-10 ">Trigger</dd>
<dt class="col-md-2 ">Circle</dt>
<dd class="col-md-10 ">button2</dd>
<dt class="col-md-2 ">X</dt>
<dd class="col-md-10 ">button3</dd>
<dt class="col-md-2 ">Square</dt>
<dd class="col-md-10 ">button4</dd>
<dt class="col-md-2 ">L1</dt>
<dd class="col-md-10 ">button5</dd>
<dt class="col-md-2 ">R1</dt>
<dd class="col-md-10 ">button6</dd>
<dt class="col-md-2 ">L2</dt>
<dd class="col-md-10 ">button7</dd>
<dt class="col-md-2 ">R2</dt>
<dd class="col-md-10 ">button8</dd>
<dt class="col-md-2 ">Select</dt>
<dd class="col-md-10 ">button9</dd>
<dt class="col-md-2 ">Start</dt>
<dd class="col-md-10 ">button10</dd>
<dt class="col-md-2 ">D-Pad</dt>
<dd class="col-md-10 ">hat</dd>
<dt class="col-md-2 ">Left Stick</dt>
<dd class="col-md-10 ">Stick</dd>
</dl>

If you need to set a specific direction on the dpad or left sick you can put the direction afterwards, separated by a slash, for example:

```unity
<HID:: USB Gamepad          >/hat/up
<HID:: USB Gamepad          >/stick/down
```

For the right stick it will not be recognized as its own thing, you'll need to add it as a 2D Vector (choose add Up\Down\Left\Right Composite from the binding dropdown)
For Up and Down, bind them to the Z axis:

```unity
<HID:: USB Gamepad          >/z
```

For Left and Right, bind them to the RZ axis:

```unity
<HID:: USB Gamepad          >/rz
```

On Up and Left, you will need to go to the processors dropdown (below bindings) and add an invert so that they will output negative values.
