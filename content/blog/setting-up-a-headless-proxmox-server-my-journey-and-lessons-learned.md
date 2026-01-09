+++
author = 'Ashintosh'
title = 'Setting Up a Headless Proxmox Server: My Journey and Lessons Learned'
description = 'Setting up a Proxmox server is an exciting challenge, but doing it headless complicates things even further. I started by configuring everything in a temporary location, as the system would eventually be moved to a location without direct access to a monitor or keyboard. The real frustration came when dealing with a default ISP router, which let to network issues that delayed the setup. Along the way, I had to secure the server, configure firewalls, and dive into troubleshooting network drivers. It was a learning process with plenty of bumps, but eventually, I got everything working smoothly. This post dives into what I learned and how I tackled each problem along the way.'
date = '2026-01-08T20:18:02-05:00'
draft = true
tags = [
    'Proxmox',
    'Home Lab',
    'Server Setup',
    'Networking',
    'IT Security',
    'Linux',
    'Virtualization',
    'Containers',
    'Network Troubleshooting',
    "SSH Security"
]
+++

One of my younger relatives came to me wanting their own private Minecraft server that everyone in the house could play on. Now, I've ran a game server or two in my time so I figured it wouldn't be too much trouble to get going. I had some older hardware that wasn't in use anymore; An old gaming desktop with a Ryzen 5 1600 processor and a modest 8GB DDR4 RAM. My plan was to set up a headless server, meaning no direct access to a monitor or keyboard once everything was up and running.

### 1. The Initial Setup: Getting Everything Connected

Since the server would eventually be moved to a remote location (the garage, to be specific), I had to configure everything in a temporary spot first. This meant setting up Proxmox on the machine in a room with a monitor and keyboard.

I installed Proxmox and initially tried setting a static IP address to a free local address on the network, but after lugging the system to the garage I quickly discovered that the default router from my ISP didn't like to use IP addresses it didn't give out through it's own DHCP server. 

This wasn't too big of an issue, so I lugged the system back to my temporary work area and configured my network interface to obtain an IP address using DHCP. I could then reserve the IP in the router's configuration panel.

This is when I discoverd my ISP like to be different, and not allow you to access the router's configuration panel directly, and instead opted to require you to configure it through their app. Of course!

After finally figuring out the login information for the account, I was able to access some router settings. Though the settings in the app were sparse, it luckily had the option for me to reserve IP addresses on the router for specific devices.

### 2. Moving the Server to the Garage (again)

Now it was time to once again move the system back into the garage. With Proxmox installed and the initial configuration done, I plugged the system into my router in the garage hoping it would receive a DHCP address. I couldn't directly see the system's output, so I kept refreshing the connected device information in the router's settings app until my NIC showed up in the list. 

Once it was connected, I was able to reserve the IP address to ensure that the server would always have the same address on the local network.

Now that the server had it's own IP address, I confirmed everything was working by going to the Proxmox web GUI using the servers local IP and then tried to SSH into the server using the root credentials I had made during the Proxmox installation. Thankfully, everything was working perfectly so far.

### 3. Securing the Server: Hardening and User Configuration

The first thing I do on any server, whether publicly or locally available, is to harden it's security with some basic measures. I created a non-root Linux user and configured SSH to SSH key only authentication. Since with was only going to be available to my local network, I decided to allow root login from SSH, but made sure to only allow login with a valid SSH key also.

I then created a non-root user for my Proxmox web UI and added Two-factor authentication to the user account and disabled the default root login.

I also decided to install and configure fail2ban to prevent brute-force of my SSH and web UI credentials. This may be overkill since again, this server will only be available from my local network, but you can never be too safe.

To make sure the system is always up-to-date on the latest security updates, I also installed and configured Unattended Upgrades to automatically download and install any security related updates for Debian.

### 4. The Proxmox Firewall: The Double-Edged Sword

Next, I tackled the Proxmox firewall. I wish I could say I have never locked myself out of one of my own remote servers due to a firewall misconfiguration, so I was sweating at this a bit. Though, I believe Proxmox has some safeguards to prevent you from blocking access to your SSH and web GUI ports on the local network. I normally use `iptables` directly, but decided to give Proxmox's firewall a shot since I could easily access the physical system to revert any changes (Well, except having to carry the system back to my work area again).

In Proxmox there are several different firewall areas you can configure. There is the `Datacenter` firewall configuration, which allows you to set firewall rules to all systems connected to your cluster. There is the `Node` firewall configuration, which allows you to set firewall rules to a specific system in the cluster. Then there is your `VM` or `CT` firewall configurations, which allow you to set firewall rules for specific virtual machines or containers on a system. 

There were some issues that I ran into with the way Proxmox handles firewall configurations though. Firstly, I tried blocking just the Proxmox web GUI port completely (leaving SSH open so I could revert it later), but I noticed that Proxmox tends to safeguard you from locking yourself out of the server when connecting from the local network. It wouldn't let me block SSH or the GUI ports at all. This annoyed me a bit at first, but I realized this is probably a good thing. 

Secondly, when I configure a firewall the first thing I do is allow SSH and `DROP` all incoming traffic by default so I can `ACCEPT` only connections to the ports I need. I had no issue doing this at the `Datacenter` and `VM`/`CT` levels, but I realized there was no option in the GUI that allowed me to set a default firewall policy at the `Node` level.

This somewhat prevented me from having the specific firewall configuration I wanted at first. Initially, I wanted to only allow port 443 for SSH and port 8006 for the Proxmox web UI and block any connections that try to access these ports from outside the local network. It seemed that by default, the `Node` would `ACCEPT` all incoming traffic unless there was a specific rule blocking it. 

I was determined to configure a rule that blocked any access to SSH and Proxmox GUI ports if not originating from the local network. Since the firewall was a sequential rule-based firewall, I configured a set of rules where the first two allowed access to SSH and Proxmox GUI ports from connections coming from the internal network. Then below those rules I created another set of rules that `DROP` any connection to the SSH and Proxmox GUI ports.

Because the firewall uses the first rule that matches the incoming traffic, if the connection was coming from the local network and trying to connect to the given ports, it would go ahead and `ACCEPT` the connection since it matches that rule first. If the incoming traffic were to originate outside of the local network, it would skip passed those first two rules and hit the next rules that `DROP` all traffic going to those ports.

This gave me the configuration I wanted so that anyone connecting outside of the local network would be `DROPPED`. Although, considering this system is only accessible from my local network in the first place, this was more of a way to get more familiar with this specific firewall frontend rather than something I absolutely needed to configure.

### 5. Monitoring the Hardware: SMART Scans

The hardware in this system was relatively old. Some of the parts in it were from the first computer I built around 2016, making some of them almost 10 years old. Some of which included the Solid State Drives (SSD) and Hard Drives (HDD).

I wanted to get an idea of how much wear these parts had on them and if I should go ahead and replace them, so I ran SMART (Self-Monitoring, Analysis, and Reporting Technology) scans on both the SSD and HDD to check their health. This was a crucial step to ensure that the hardware was in good shape, as I didn't want to risk data loss down the line. 

[INSERT TEST RESULT SUMMARY HERE]

### 6. Network Troubleshooting: The Real Pain Point

Here's where things got tricky. Despite having everything configured, I started noticing that the server would lose network connectivity every now and then, which preventing me from accessing it remotely until restarting the server. When this happened, the system would show as disconnected in the router's settings app, but still had the link light on the NIC flashing. At first I though my CAT 5 Ethernet cable was failing, but after switching it to a newer CAT 6e, it was still having this intermittent issue. 

I started looking through the different logs trying to get an idea of why this may have been happening, having to run back and forth to restart the server every time is disconnected.

I ran the `dmesg | grep -i eth` an `dmesg | grep -i vmbr` commands and found logs like the following:

```
[    3.028969] r8169 0000:06:00.0 enp6s0: renamed from eth0
[   26.447653] fwbr100i0: port 2(veth100i0) entered blocking state
[   26.447659] fwbr100i0: port 2(veth100i0) entered disabled state
[   26.447675] veth100i0: entered allmulticast mode
[   26.447743] veth100i0: entered promiscuous mode
[   26.506969] eth0: renamed from vethFqPSP1
[   27.453813] fwbr100i0: port 2(veth100i0) entered blocking state
[   27.453828] fwbr100i0: port 2(veth100i0) entered forwarding state
[  621.883035] fwbr100i0: port 2(veth100i0) entered disabled state
[  621.883266] veth100i0 (unregistering): left allmulticast mode
[  621.883271] veth100i0 (unregistering): left promiscuous mode
[  621.883276] fwbr100i0: port 2(veth100i0) entered disabled state
```
```
[    8.502103] vmbr0: port 1(nic0) entered blocking state
[    8.502109] vmbr0: port 1(nic0) entered disabled state
[    8.691880] vmbr0: port 1(nic0) entered blocking state
[    8.691886] vmbr0: port 1(nic0) entered forwarding state
[   12.281376] vmbr0: port 1(nic0) entered blocking state
[   12.281390] vmbr0: port 1(nic0) entered forwarding state
[   26.419224] vmbr0: port 2(fwpr100p0) entered blocking state
[   26.419232] vmbr0: port 2(fwpr100p0) entered disabled state
[   26.419382] vmbr0: port 2(fwpr100p0) entered blocking state
[   26.419386] vmbr0: port 2(fwpr100p0) entered forwarding state
[  622.601857] vmbr0: port 2(fwpr100p0) entered disabled state
[  622.602294] vmbr0: port 2(fwpr100p0) entered disabled state
```

These logs showed the interfaces state changing to a "blocking" or "disabled" state which corresponded to when my network was temporarily unavailable.

After doing some research online, I found the following <a href="https://community.hetzner.com/tutorials/installing-the-r8168-driver?from_column=20423&from=20423" target="_blank">community post</a> from Hetzner.

In this post, it referenced the same Realtek r8169 driver that my system was currently using. The article stated "The Linux r8169 driver for the Realtek network chips does not always work correctly up to kernel version 4.16. There can be timeouts and/or frequent link up/link down state changes, bandwidth problems and even system crashes may occur".

This sounded very similar to the issue I was currently having. It says in the post it recommended switching to the r8168 driver.

I found this <a href="https://github.com/mtorromeo/r8168" target="_blank">GitHub Repo</a> with source for the r8168 driver I needed and cloned it to my system. The provided `autorun.sh` was going to remove the current r8169 driver before installing the new one, which would potentially prevent me from being able to access the server remotely. So instead I compiled and installed the source manually with `make` & `make install`. I then added the old r8169 driver to the `/etc/modprobe.d/blacklist-r8169.conf` file to blacklist it and prevent it from running, then added the new r8168 driver to `/etc/modules-load.d/r8168.conf` to load that driver on boot instead.

### 7. The Final Result: A Fully Working Headless Server

After hours of troubleshooting, configuring, and testing, I finally had a stable, headless Proxmox server running in my garage. The system was fully secured, the network was now stable thanks to the new driver, and I was able to run virtual machines and containers with no issues.

## Lessons Learned

- **Always Test Network Configuration *Before* Moving the Server**: It's always a good idea to test your network setup thoroughly before moving you server to its permanent location. When configuring a headless system, it's important it can obtain a DHCP lease or that you've correctly configured static IPs to avoid problems later.

- **Don't rely on default ISP routers for advanced configuration**: Not all routers (especially ISP-provided ones) offer robust configuration options. In cases like these, you might want to consider using your own router for more control, especially if you're configuring multiple devices or need advanced settings like static IP reservations.

- **The Importance of Proper Security Configuration**: Security is never too much of a priority, even for local servers. Taking time to configure proper authentication methods, firewall rules, and fail2ban can help prevent future headaches, especially if you might later open your server to the internet. It's a good habit to implement these precautions on all systems, even if you believe it's unnecessary.

- **Proxmox Firewall: A Blessing and a Curse**: Understanding how Proxmox's firewall works and the importance of rule ordering is key. Even though the UI might seem limiting at times, it's important to know how it handles traffic and plan rules carefully. Setting up firewall rules properly, especially in a headless setup, can prevent you from locking yourself out in the future.

- **Driver Compatibility Can Be a Big Headache**: When working with older or less common hardware, always check the compatibility of drivers with your kernel. If you encounter frequent disconnections or hardware malfunctions, switching to a different driver might be necessary. Don't assume the default driver will work perfectly outo f the box. Sometimes, manual intervention is required.

- **Documenting Your Steps Is Crucial**: Document your configuration and troubleshooting steps, even if it seems obvious. Keeping a log or taking screenshots as you go can save you time down the road when things break, or when you need to replicate your setup. It's also a great resource for anyone else you might want to help with similar projects.

- **Headless Server Setup Requires Extra Attention to Detail**: A headless setup requires planning and testing before moving the system to its final location. Ensure that all services, networking, and user configurations are thoroughly testing before making the system "inaccessible." Using a temporary setup with full access will save you time and frustration later.

- **Hardware Age Can Affect Performance**: Even if the hardware seems functional, it's worth checking its health. Especially with drives that are several years old. Running regular diagnostics and monitoring the health of your system can prevent data loss and help you decide when it's time for an upgrade.

---

By documenting my journey here, I hope I can help someone avoid the same headaches I faced and give them the confidence to tackle their own headless Proxmox setup.

Let me know if you need more details or have any questions about specific parts of the process!
