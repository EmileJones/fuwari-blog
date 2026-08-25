---
title: Bash 基本使用指南：环境配置、变量与常用命令
published: 2025-08-25
description: 介绍 Bash 的编码问题、环境配置、变量操作、常用命令、正则处理工具和 Shell 脚本编写习惯。
image: ''
tags: [Bash, Shell, Linux, 命令行]
category: Tools
draft: false
lang: zh_CN
---

# **中文编码问题**

## **DOS与Linux的换行符**

DOS系统的换行符为CR，Linux的换行符为\[LF\]，所以会产生DOS系统文件到Linux系统会错误的问题。解决只需要一下命令：

``` shellscript
 dos2unix [-kn] file [newfile]
 unix2dos [-kn] file [newfile]
 -k: 保留文件原本的mtime格式
 -n: 保留原本的旧文件
```

## **语系编码转换**

大陆购买的Windows系统默认是GBK编码，而Linux是UTF-8编码。可用以下方式转换编码格式：

``` shellscript
 iconv -f gbk -t utf-8 origin_file -o new_file
```

# **bash的环境配置文件**

## **login shell 与 non-login shell**

- login shell: 取得bash时需要完整的登陆流程，就称为login shell。

- non-login shell: 取得bash的方法不需要重复的登陆操作。例如在原本的bash环境下再次执行bash，由于不需要账号密码登陆，第二个bash就是non-login shell

## **配置文件**

- `/etc/profile`（login shell 才会读）

- `/etc/profile.d/*.sh`

- `/etc/locale.conf`

- `~/.bash.profile`（login shell 才会读）

- `~/.bashrc` （non-login shell会读）

- `~/.bash_logout`（当注销bash后，系统会执行）

# **变量内容的删除、取代与替换**

## **删除**

| **变量设置方式**   | **注释**                               |
|--------------------|----------------------------------------|
| \${variable#word}  | 删除从前面查找符合替换字符最短的那一个 |
| \${variable##word} | 删除从前面查找符合替换字符最长的那一个 |
| \${variable%word}  | 删除从后面查找符合替换字符最短的那一个 |
| \${variable%%word} | 删除从后面查找符合替换字符最长的那一个 |

## **替换**

| **变量设置方式**      | **注释**                                  |
|-----------------------|-------------------------------------------|
| \${variable/old/new}  | 若变量内容符合old，则第一个old会被new替代 |
| \${variable//old/new} | 若变量内容符合old，则全部old会被new替代   |

## **变量的测试与内容替换**

| **变量设置方式** | **variable没有设置** | **variable为空字符串** | **variable被设置** |
|----|----|----|----|
| var=\${variable-expr} | var=expr | var= | var=\$str |
| var=\${variable:-expr} | var=expr | var=expr | var=\$str |
| var=\${variable?expr} | expr输出至stderr | var= | var=\$str |
| var=\${variable:?expr} | expr输出至stderr | expr输出至stderr | var=\$str |

# **常用命令**

## **read**

用来获取用户的输入

``` shellscript
 read [-pt] variable
 -p: 后面可以接提示字符
 -t: 后面可以接等待的[秒数]
```

## **declare**

用来声明变量类型

``` shellscript
 declare [-aixr] variable
 -a: 将后面名为variable的变量定义为array类型
 -i: 将后面名为variable的变量定义为integer类型
 -x: 将后面的variable变成环境变量
 -r: 将变量设置为readonly类型
```

## **cut**

用来切割一行内容

``` shellscript
 cut -d'分隔字符' -f num
 cut -c 字符区间
 -d: 后面接分割字符
 -f: 根据-d的分隔字符将一段信息划分为数段，用-f取出第num段
 -c: 以字符的单位取出固定字符区间
```

# **正则表达式与文件格式化处理**

## **语系对正则表达式的影响**

LANG=C时: 0 1 2 3 4 \... A B C D \... a b c d

LANG=zh_CN时: 0 1 2 3 4 \... a A b B c C d D

为了避免语系所造成的选取错误，有一些符号需要了解：

| **特殊符号** | **代表意义**                                       |
|--------------|----------------------------------------------------|
| \[:alnum:\]  | 0-9, A-Z, a-z                                      |
| \[:alpha:\]  | A-z, a-z                                           |
| \[:blank:\]  | \[Space\], \[Tab\]                                 |
| \[:cntrl:\]  | 键盘上的控制按键，包括CR、LF、Tab、Del等           |
| \[:digit:\]  | 0-9                                                |
| \[:graph:\]  | 除了\[Space\] 和 \[Tab\] 的所有按键                |
| \[:lower:\]  | a-z                                                |
| \[:print:\]  | 表示任何能被打印出来的字符                         |
| \[:punct:\]  | 代表标点符号                                       |
| \[:upper:\]  | A-Z                                                |
| \[:space:\]  | 任何会产生空白的字符，包括\[Space\], \[Tab\], CR等 |
| \[:xdigit:\] | 0-9, A-F, a-f                                      |

## **sed工具**

sed可以将数据进行替换、删除、新增、选取等特定功能

``` shellscript
 sed [-nefr] [操作]
 a: 新增，可以接字符，而这些字符会在新的一行出现
 c: 替换，c的后面可以接字符，这些字符可以替换n1,n2之间的行
 d: 删除
 i: 插入
 s: 替换，通常搭配正则表达式

 cat /etc/passwd | sed '2,5d' # 删除第2-5行
 cat /etc/passwd | sed '2a drink tea?' # 在第2行后（第三行）增加
 cat /etc/passwd | sed '2i drink tea?' # 在第2行前（第一行）增加
 cat /etc/passwd | sed '2c replace' # 在第2行替换
```

## **awk工具**

sed用来处理行间的数据，awk用来处理行内的数据

``` shellscript
 awk '条件类型1{操作1} 条件类型2{操作2} ...' filename
```

awk用有几个内置的常用变量

| **变量名称** | **代表意义**                 |
|--------------|------------------------------|
| NF           | 每一行拥有的字段总数         |
| NR           | 目前awk处理的是第几行数据    |
| FS           | 目前的分隔字符，默认是空格键 |

FS可以自己设置值：

``` shellscript
 awk 'BEGIN {FS=":"} {printf "%s \t %s \t %s \n", $1, $3, $4}' /etc/passwd
```

awk还可以使用逻辑运算字符，进行条件判断

| **运算单元** | **代表意义** |
|--------------|--------------|
| \>           | 大于         |
| \<           | 小于         |
| \>=          | 大于或等于   |
| \<=          | 小于或等于   |
| ==           | 等于         |
| !=           | 不等于       |

``` shellscript
cat /etc/passwd | awk 'BEGIN {FS=":"} $3 < 10 {print $1 "\t" $3}'
```

# **学习shell脚本**

## **建立shell脚本良好的编写习惯**

1.  为了取得较佳的执行环境，建议自行先定义好一些一定会被用到的环境变量，例如PATH（重要）

2.  脚本内较特殊的命令，使用 **绝对路径** 的方式来执行

3.  注释脚本的功能

4.  声明使用脚本shell的名称（重要）

5.  定义返回值

一个规范的shell脚本的例子如下：

``` shellscript
#!/bin/bash
# Program:
#    This is a program shows "Hello World" in your screen.
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
export PATH
echo -e "Hello World! \a \n"
exit 0
```

## **利用test命令的测试功能**

判断某个文件（`test [option] [filename]`）:

| **测试的参数** | **代表意义**                   |
|----------------|--------------------------------|
| -e             | 该\[filename\]是否存在         |
| -f             | 该\[filename\]是否存在且为文件 |
| -d             | 该\[filename\]是否存在且为目录 |
| -e             | 该\[filename\]是否存在         |
| -e             | 该\[filename\]是否存在         |

判断字符串的数据（`test [option] [string]`）:

| **测试的参数** | **代表意义**         |
|----------------|----------------------|
| -z             | 该\[string\]是否为空 |
| -n             | 该\[string\]是否不空 |

多重条件判定（例如：`test [option] [argument] -a [option] [argument]`）：

| **测试的参数** | **代表意义** |
|----------------|--------------|
| -a             | and          |
| -o             | or           |
| !              | not          |

## **利用判断符号**`[]`

在`[]`中就可以直接使用编程经常使用的符号来进行判断，例如`<`、`>=`、 `!=`等。

但是需要注意一下内容：

- 在`[]`内的每个组件最好都用\[Space\]分隔

- 在`[]`的每个变量最好都用`""`括起来

- 在`[]`内的常数，最好都用`''`括起来

## **shell脚本的默认变量**

shell脚本的默认变量类似于其他编程语言中传入方法的参数一样

| **符号** | **代表意义** |
|----|----|
| \$0 | 脚本文件名 |
| \$n | n是数字，表示第n个参数 |
| \$# | 后面接入的参数个数 |
| \$@ | 代表`"$1" "$2" "$3" "$4"`，每个变量都是独立的 |
| \$\* | 代表`"$1c$2c$3c$4"`，其中`c`为分隔字符，默认为空格，可以使用`IFS`变量设置分隔符 |

shell还提供了变量偏移的功能(`shift`)

``` shellscript
#!/bin/bash
# Program:
#    This is a program shows "Hello World" in your screen.
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin
export PATH
echo "第一个参数 ==> $1"
shift
echo "第二个参数 ==> $1"
exit 0
```

## **条件判断语法**

- if\...then:

``` shellscript
if [ condition ]; then
    code
elif [ condition ]; then
    code
else
    code
fi
```

- case\...esac

``` shellscript
case $field in
    "first key")
        code
        ;;
    "second key")
        code
        ;;
    *)
        code
        ;;
esac
```

- loop

``` shellscript
while [ condition ]
do
    code
done
```

``` shellscript
until [ condition ]
do
    code
done
```

``` shellscript
for var in con1 con2 con3 ...
do
    code
done
```

``` shellscript
for (( 初始值; 限制值; 赋值运算 ))
do
    code
done
```

## **shell脚本的跟踪与调试**

``` shellscript
sh [-nvx] script.sh
-n: 不执行脚本，仅检查语法问题
-v: 在执行脚本前，先将脚本文件的内容输出到屏幕上
-x: 将使用到的脚本内容显示到屏幕上
```
