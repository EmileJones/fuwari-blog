---
title: 编译自己的 OpenWrt：从构建到基本配置
published: 2025-08-02
description: 记录 OpenWrt 固件的编译流程，以及创建系统后的基本配置方法。
image: ''
tags: [OpenWrt, 路由器, 固件编译, 家庭实验室]
category: Tech
draft: false
lang: zh_CN
---

# **编译OpenWrt**

1.  拉取[openwrt](https://github.com/openwrt/openwrt)

2.  切换到稳定版本(我使用的23.05)

    必须使用稳定版本，如果使用SNAPSHOT版本，会导致各种错误发生

3.  拉取argon

    ``` shellscript
     cd openwrt/package
     git clone https://github.com/jerrykuku/luci-theme-argon.git
    ```

4.  根据官方文档配置环境

    在`./scripts/feeds update -a`或者`./scripts/feeds install -a`时，如果失败，则查看输出，下载缺失的包

5.  在使用`make menuconfig`时，需要注意一下事项

    1.  基本设置

        ``` plaintext
         Target Image --> Kernel partition size --> 32MB # 在我编译的时候一直提示BIOS所剩空间很小，于是稍微调大了一些
         Target Image --> Root filesystem partition size --> 512MB # 太小会导致编译失败
         Target system --> x86
         Subtarget --> x86_64
         Target Profile --> Generic x86/64
         Kernel modules --> Network Support --> kmod-9pnet
         Global build setting --> Select all kernel module packages by default # 如果需要kernel module可以直接模块化挂载，不至于重新编译
        ```

    2.  使用WebUI以及argon

        ``` plaintext
         LuCI --> Collections --> luci
         LuCI --> Themes --> luci-theme-argon
        ```

    3.  安装openvpn

        ``` plaintext
         LuCI --> Applications --> luci-app-openvpn
         LuCI --> Collections --> luci-ssl-openssl
         Network --> VPN --> openvpn-openssl
        ```

    4.  安装V2raya

        ``` plaintext
         LuCI --> Applications --> luci-app-v2raya
         Network --> IP Addresses and Names --> v2ray-geoip
         Network --> IP Addresses and Names --> v2ray-geosite
        ```

# **创建OpenWrt并进行基本配置**

1.  创建Openwrt VM

    1.  将`./bin/targets/x86/64/openwrt-x86-64-generic-ext4-combined.img.gz` 存入PVE的iso中

    2.  执行命令`qm importdisk VM_Id /var/lib/vz/template/iso/openwrt-23.05-x86-64-generic-ext4-combined.img local-lvm`

    3.  设置开机引导顺序

    4.  启动后访问Web UI

2.  配置防火墙

    在Openwrt的WebUI上配置NAT和Forward。NAT使用MASQUERADE模式，端口转发设置为全部允许

3.  开启`quem-guest-agent`

    执行命令 `opkg update && opkg install quem-ga && reboot`

4.  配置Nextdns

    按照官方引导配置`dnsmasq.conf`即可

    > 如果使用的不是稳定版本可能会导致DNS不稳定

5.  配置V2ray

    按照官方的[手册](https://v2raya.org/en/docs/prologue/introduction/)进行配置

    > 在配置好代理后，所有通过代理的主机都需要设置ssh才能使用github的ssh功能，具体设置参照[文档](https://docs.github.com/en/authentication/troubleshooting-ssh/using-ssh-over-the-https-port)
