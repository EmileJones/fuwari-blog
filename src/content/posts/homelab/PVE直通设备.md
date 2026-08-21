---
title: PVE 设备直通：显卡与硬盘配置
published: 2025-08-02
description: 记录在 Proxmox VE 中配置显卡、SATA 硬盘和 SATA 控制器直通的实践方法。
image: ''
tags: [PVE, Proxmox VE, 虚拟化, 设备直通]
category: homelab
draft: false
lang: zh_CN
---

# **直通显卡**

1.  进入BIOS打开`IOMMU/VT-d`（Input-Output Memory Management Unit，输入输出内存管理单元）

2.  配置PVE的grub（`nano /etc/default/grub`）

    找到`GRUB_CMDLINE_LINUX_DEFAULT="quiet“`这一行 将其改为`GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt video=efifb:off "`

> `quiet`: 减少启动过程中输出到屏幕的日志信息 `intel_iommu=on`: 启用 Intel 的 IOMMU，如果是amd，则应为`amd_iommu=on` `iommu=pt`: 启用 "pass-through"（直通）模式的 IOMMU `video=efifb:off`: 禁用 EFI framebuffer（efifb），防止 EFI framebuffer 占用显卡资源

3.  指定在系统启动时需要加载的内核模块

    在`/etc/modules`中添加以下内容

``` plaintext
 vfio
 vfio_iommu_type1
 vfio_pci
 vfio_virqfd
```

> `vfio`: 提供 VFIO（Virtual Function I/O，虚拟功能 I/O）的基础功能，为用户空间程序（如 QEMU）提供了对 PCI 设备的直接控制接口，它通过 `/dev/vfio`提供设备节点，可以通过这些节点与物理设备交互。 `vfio_iommu_type1`: 实现了 VFIO 的 IOMMU 支持 `vfio_pci`: 提供了对 PCIe 设备直通 的支持 `vfio_virqfd`: 提供虚拟机中断处理的支持，将物理设备的中断虚拟化，使虚拟机可以以高效、安全的方式处理中断

4.  配置VFIO

    输入 `lspci -nn` ，得到类似以下内容，获取设备ID

    ``` plaintext
     00:02.0 VGA compatible controller [0300]: Intel Corporation Alder Lake-P Integrated Graphics Controller [8086:46d6] (rev 0c)
     01:00.0 VGA compatible controller [0300]: NVIDIA Corporation TU117GLM [Quadro T400 Mobile] [10dg:1fa2] (rev a1)
    ```

    将 设备ID（10dg:1fa2）和 音频ID （10dg:10fd） 写入到 /etc/modprobe.d/vfio.conf

    ``` plaintext
     options vfio-pci ids=10dg:1fa2,10dg:10fd
    ```

5.  屏蔽显卡驱动，不让PVE使用

在`/etc/modprobe.d/pve-blacklist.conf`中加入如下内容

``` shellscript
 # Nvidia
 blacklist nvidiafb
 blacklist nouveau
 blacklist nvidia

 # AMD
 blacklist amdgpu
 blacklist radeon
```

6.  使配置文件生效

``` shellscript
 update-initramfs -u
 update-grub
```

7.  重启PVE系统

8.  给需要的虚拟机添加PCI设备

# **直通硬盘**

truenas直通硬盘有两种方式

1.  直通SATA硬盘

2.  直通SATA controller

## **直通SATA硬盘**

1.  查看自己的硬盘id

    `ls -i /dev/disk/by-id`

2.  直通硬盘

    `qm set {虚拟机id} --{挂载的格式} /dev/disk/by-id/{硬盘id}`

    挂载格式有:

    - sata

    - scsi

    - iden（n属于0-3的数字，例如ide3）

## **直通SATA Controller（未实践）**

1.  同直通显卡的1、2、3、4步骤

2.  在`/etc/modprobe.d/pve-blacklist.conf`中加入如下内容

    ``` shellscript
     # ahci
     blacklist ahci
    ```

3.  使配置文件生效

    ``` shellscript
     update-initramfs -u
     update-grub
    ```

4.  重启PVE系统

5.  给需要的虚拟机添加PCI设备

\
